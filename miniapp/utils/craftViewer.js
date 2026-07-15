/**
 * 工艺品沉浸式鉴赏 H5 URL 拼装与白名单校验
 */
const { craftViewerBaseUrl, craftViewerAllowedHosts, ENV } = require('../config/env')

const DEV_LOCAL_HOSTS = ['localhost', '127.0.0.1']
const DEV_LAN_RE = /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/

function parseHost(url) {
  const m = String(url || '').match(/^https?:\/\/([^/:?#]+)/i)
  return m ? m[1].toLowerCase() : ''
}

function isDevLocalHost(host) {
  if (!host) return false
  return DEV_LOCAL_HOSTS.includes(host) || DEV_LAN_RE.test(host)
}

/** web-view 可打开的 URL（生产须 https；dev 允许本机/局域网 http） */
function isValidViewerUrl(url) {
  if (!url) return false
  const s = String(url)
  if (s.startsWith('https://')) return true
  return ENV === 'dev' && s.startsWith('http://') && isDevLocalHost(parseHost(s))
}

function buildCraftViewerUrl(craftId) {
  const base = String(craftViewerBaseUrl || '').replace(/\/$/, '')
  if (!base || !craftId) return ''
  return `${base}/craft/${craftId}`
}

function isAllowedViewerHost(url) {
  if (!isValidViewerUrl(url)) return false
  const host = parseHost(url)
  if (!host) return false
  if (ENV === 'dev' && isDevLocalHost(host)) return true
  const allowed = craftViewerAllowedHosts || []
  return allowed.some((h) => {
    const rule = String(h).toLowerCase()
    return host === rule || host.endsWith('.' + rule)
  })
}

module.exports = {
  buildCraftViewerUrl,
  isValidViewerUrl,
  isAllowedViewerHost,
  parseHost
}
