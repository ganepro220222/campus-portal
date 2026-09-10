/**
 * 工作台写接口的浏览器跨站防护。
 * Origin / Sec-Fetch-Site 由浏览器强制附加，页面脚本改不了。
 * 只认 Host，不认 X-Forwarded-Host：后者请求方可伪造，对上 Origin 就放行了。
 * 比的是主机名和端口，不比协议，避免反代终结 HTTPS 后上游仍是 HTTP。
 * 无 Origin 且不是 cross-site（curl、脚本）放行。
 * Node / serve.py / api.php 三条规则必须一致。
 */

function headerValue(headers, name) {
  if (!headers) return ''
  const raw = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()]
  const first = Array.isArray(raw) ? raw[0] : raw
  return String(first || '').split(',')[0].trim()
}

export function authorityKey(hostOrOrigin) {
  const s = String(hostOrOrigin || '').trim()
  if (!s) return ''
  try {
    const u = /:\/\//.test(s) ? new URL(s) : new URL('http://' + s)
    const hostname = String(u.hostname || '').toLowerCase()
    if (!hostname) return ''
    const port = String(u.port || '')
    if (!port || port === '80' || port === '443') return hostname
    return hostname + ':' + port
  } catch {
    return ''
  }
}

export function denyStudioWriteReason(headers) {
  const site = headerValue(headers, 'sec-fetch-site').toLowerCase()
  if (site === 'cross-site') return 'cross-site'
  const origin = headerValue(headers, 'origin')
  if (!origin) return ''
  if (origin.toLowerCase() === 'null') return 'null-origin'
  const originKey = authorityKey(origin)
  if (!originKey) return 'bad-origin'
  const host = headerValue(headers, 'host')
  if (!host) return 'missing-host'
  if (originKey !== authorityKey(host)) return 'origin-mismatch'
  return ''
}

export function denyStudioWriteContentType(contentType) {
  const t = String(contentType || '').split(';')[0].trim().toLowerCase()
  return t === 'application/json' ? '' : 'content-type'
}
