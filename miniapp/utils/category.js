// utils/category.js — 分类标签加载（接口失败时使用本地默认值）

const { get } = require('./request')
const mock = require('../mock/defaults')

function toCatNames(list) {
  if (!list || !list.length) return null
  const names = list.map(item => {
    if (typeof item === 'string') return item
    return item.name || item.categoryName || ''
  }).filter(Boolean)
  return names.length ? ['全部', ...names] : null
}

async function loadCategoryNames(type) {
  const fallback = (mock.categories && mock.categories[type]) || ['全部']
  try {
    const res = await get('/categories', { type })
    return toCatNames(res) || fallback
  } catch (err) {
    console.warn('[category] 分类加载失败，使用默认', type, err)
    return fallback
  }
}

module.exports = { loadCategoryNames }
