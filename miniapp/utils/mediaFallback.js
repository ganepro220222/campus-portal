// utils/mediaFallback.js — 详情封面 / 图库加载失败回退，不把整页打成加载失败

const { coverUrlOf, readEventDataset } = require('./coverFallback')

const COVER_ITEM_KEYS = {
  article: true,
  detail: true
}

const IMAGE_RETRY_HINT = '图片加载失败，点击重试'
const PREVIEW_FAIL_TOAST = '大图打开失败，请稍后重试'
const PREVIEW_EMPTY_TOAST = '暂无可以查看的图片'

function toIndex(value) {
  const n = Number(value)
  return Number.isInteger(n) ? n : -1
}

function sameEpoch(item, epoch) {
  if (epoch == null || epoch === '') return true
  return Number(item && item.imageEpoch || 0) === Number(epoch)
}

function markItemCoverFailed(item, expectedUrl) {
  if (!item || item.coverFailed) return item
  const expect = expectedUrl == null || expectedUrl === '' ? '' : String(expectedUrl)
  if (expect && coverUrlOf(item) !== expect) return item
  return { ...item, coverFailed: true }
}

function itemCoverFailedPatch(data, itemKey, expectedUrl) {
  if (!COVER_ITEM_KEYS[itemKey]) return null
  const item = data && data[itemKey]
  const next = markItemCoverFailed(item, expectedUrl)
  if (next === item) return null
  return { [itemKey]: next }
}

function applyItemCoverFailed(page, itemKey, e) {
  if (!page || typeof page.setData !== 'function') return false
  const ds = readEventDataset(e)
  const patch = itemCoverFailedPatch(page.data, itemKey, ds.cover)
  if (!patch) return false
  page.setData(patch)
  return true
}

function markIndexedImageFailed(list, index, expectedUrl, epoch) {
  const idx = toIndex(index)
  if (!Array.isArray(list) || idx < 0 || idx >= list.length) return list
  const item = list[idx]
  if (!item || item.imageFailed) return list
  const expect = expectedUrl == null || expectedUrl === '' ? '' : String(expectedUrl)
  if (expect && String(item.imageUrl || '') !== expect) return list
  if (!sameEpoch(item, epoch)) return list
  const next = list.slice()
  next[idx] = { ...item, imageFailed: true }
  return next
}

function retryIndexedImage(list, index) {
  const idx = toIndex(index)
  if (!Array.isArray(list) || idx < 0 || idx >= list.length) return list
  const item = list[idx]
  if (!item || !item.imageFailed) return list
  const next = list.slice()
  next[idx] = {
    ...item,
    imageFailed: false,
    imageEpoch: Number(item.imageEpoch || 0) + 1
  }
  return next
}

function usableImageUrls(list) {
  return (list || [])
    .filter((item) => item && item.imageUrl && !item.imageFailed)
    .map((item) => item.imageUrl)
}

function markNestedImageFailed(sections, sidx, midx, expectedUrl, epoch) {
  const si = toIndex(sidx)
  const mi = toIndex(midx)
  if (!Array.isArray(sections) || si < 0 || si >= sections.length) return sections
  const section = sections[si]
  const items = section && section.items
  const nextItems = markIndexedImageFailed(items, mi, expectedUrl, epoch)
  if (nextItems === items) return sections
  const next = sections.slice()
  next[si] = { ...section, items: nextItems }
  return next
}

function retryNestedImage(sections, sidx, midx) {
  const si = toIndex(sidx)
  const mi = toIndex(midx)
  if (!Array.isArray(sections) || si < 0 || si >= sections.length) return sections
  const section = sections[si]
  const items = section && section.items
  const nextItems = retryIndexedImage(items, mi)
  if (nextItems === items) return sections
  const next = sections.slice()
  next[si] = { ...section, items: nextItems }
  return next
}

function replaceField(obj, field, nextValue) {
  if (!obj || obj[field] === nextValue) return obj
  return { ...obj, [field]: nextValue }
}

function slideCaption(slide, fallback) {
  if (slide && slide.imageFailed) return IMAGE_RETRY_HINT
  return (slide && slide.caption) || fallback || ''
}

function previewImages(wxApi, urls, current) {
  const api = wxApi || (typeof wx !== 'undefined' ? wx : null)
  const list = (urls || []).filter((u) => u)
  if (!api || typeof api.showToast !== 'function') return false
  if (!list.length) {
    api.showToast({ title: PREVIEW_EMPTY_TOAST, icon: 'none' })
    return false
  }
  const currentUrl = current && list.indexOf(current) >= 0 ? current : list[0]
  if (typeof api.previewImage !== 'function') return false
  api.previewImage({
    urls: list,
    current: currentUrl,
    fail() {
      api.showToast({ title: PREVIEW_FAIL_TOAST, icon: 'none' })
    }
  })
  return true
}

module.exports = {
  COVER_ITEM_KEYS,
  IMAGE_RETRY_HINT,
  PREVIEW_FAIL_TOAST,
  PREVIEW_EMPTY_TOAST,
  markItemCoverFailed,
  itemCoverFailedPatch,
  applyItemCoverFailed,
  markIndexedImageFailed,
  retryIndexedImage,
  usableImageUrls,
  markNestedImageFailed,
  retryNestedImage,
  replaceField,
  slideCaption,
  previewImages
}
