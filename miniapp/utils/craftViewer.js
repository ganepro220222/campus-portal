/**
 * 工艺品沉浸式鉴赏 H5 URL 拼装与白名单校验
 */
const { craftViewerBaseUrl, craftViewerAllowedHosts } = require('../config/env')

function buildCraftViewerUrl(craftId) {
  const base = String(craftViewerBaseUrl || '').replace(/\/$/, '')
  if (!base || !craftId) return ''
  return `${base}/craft/${craftId}`
}

function parseHost(url) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch (e) {
    return ''
  }
}

function isAllowedViewerHost(url) {
  if (!url || !url.startsWith('https://')) return false
  const host = parseHost(url)
  if (!host) return false
  const allowed = craftViewerAllowedHosts || []
  return allowed.some((h) => host === String(h).toLowerCase() || host.endsWith('.' + String(h).toLowerCase()))
}

module.exports = {
  buildCraftViewerUrl,
  isAllowedViewerHost
}
