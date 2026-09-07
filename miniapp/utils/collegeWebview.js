// utils/collegeWebview.js — 学院/展馆 web-view 启动参数

const WEBVIEW_ROUTE = 'packageC/college/webview'
const DEFAULT_TITLE = '学院内容'

function decodeQueryComponent(raw, fallback) {
  const text = raw == null ? '' : String(raw)
  if (!text) return { ok: true, value: fallback }
  try {
    return { ok: true, value: decodeURIComponent(text) }
  } catch (err) {
    return { ok: false, value: fallback }
  }
}

function resolveWebviewBoot(options) {
  const opts = options || {}
  const urlPart = decodeQueryComponent(opts.url, '')
  if (!urlPart.ok) {
    return { ok: false, reason: 'decode' }
  }
  const titlePart = decodeQueryComponent(opts.title, DEFAULT_TITLE)
  const title = titlePart.ok ? (titlePart.value || DEFAULT_TITLE) : DEFAULT_TITLE
  const url = urlPart.value
  if (!url || !url.startsWith('https://')) {
    return { ok: false, reason: 'invalid', title }
  }
  return { ok: true, url, title }
}

module.exports = {
  WEBVIEW_ROUTE,
  DEFAULT_TITLE,
  decodeQueryComponent,
  resolveWebviewBoot
}
