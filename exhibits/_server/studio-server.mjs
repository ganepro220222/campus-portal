#!/usr/bin/env node
/**
 * 3D 鉴赏工作台 · 参考服务（零依赖，Node 内置模块）
 *
 *   STUDIO_USER=admin STUDIO_PASS=你的密码 node _server/studio-server.mjs
 *   # 打开 http://127.0.0.1:8199/studio.html （会弹 Basic Auth 登录）
 *
 * 提供：
 *   - 静态托管整个 exhibits/（并给 player.html 注入 window.__SAVE_API__，使「保存」直接写回）
 *   - GET  /studio-api/list        列出所有展品（工作台自动加载，免手维护 manifest）
 *   - GET  /studio-api/identity    返回本目录实例 ID（启动器校验端口归属）
 *   - POST /studio-api/save        写回 <ex>/config.json，写前自动备份上一版到 <ex>/.bak/
 *   - Basic Auth 保护全部（生产务必设 STUDIO_PASS；不设则仅本机可用并告警）
 *
 * 上线：部署在自有服务器（独立端口或 URL 前缀均可），
 *       可由 Nginx 反代 /studio-api/ 到本服务、静态文件由 Nginx 直接分发；本文件为参考实现。
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { computeRootHash, getIdentityPayload } from './studio-identity.mjs'
import { createExhibit } from '../exhibit-create.mjs'
import { assetFingerprint, hasAssetFile, listPanoramaCandidates } from '../pano-check.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..') // exhibits/
const ROOT_HASH = computeRootHash(ROOT)
const PORT = Number(process.env.PORT || 8199)
const USER = process.env.STUDIO_USER || 'admin'
const PASS = process.env.STUDIO_PASS || ''
const SAFE = /^[a-zA-Z0-9_-]+$/
const BAK_KEEP = 20
const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0' }
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.css':'text/css; charset=utf-8', '.glb':'model/gltf-binary', '.gltf':'model/gltf+json',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.wav':'audio/wav', '.mp3':'audio/mpeg', '.m4a':'audio/mp4' }

if (!PASS) console.warn('⚠  未设 STUDIO_PASS：无鉴权，请勿暴露到公网！生产请  STUDIO_PASS=… node …')

function authed(req, res) {
  if (!PASS) return true
  const h = req.headers.authorization || ''
  const [, b64] = h.split(' ')
  const [u, p] = Buffer.from(b64 || '', 'base64').toString().split(':')
  if (u === USER && p === PASS) return true
  res.writeHead(401, { ...NO_STORE, 'WWW-Authenticate': 'Basic realm="3D Studio", charset="UTF-8"' }); res.end('需要登录')
  return false
}
function isLocalhost(req) {
  const a = req.socket.remoteAddress || ''
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'
}
const send = (res, code, type, body, extraHeaders = {}) => {
  res.writeHead(code, { 'Content-Type': type, ...extraHeaders })
  res.end(body)
}
const json = (res, code, obj) => send(res, code, 'application/json; charset=utf-8', JSON.stringify(obj), NO_STORE)

function listExhibits() {
  const out = []
  for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('_') || d.name.startsWith('.')) continue
    const cp = path.join(ROOT, d.name, 'config.json')
    if (!fs.existsSync(cp)) continue
    try {
      const c = JSON.parse(fs.readFileSync(cp, 'utf8')); const zh = (c.i18n && c.i18n.zh) || {}
      const exDir = path.join(ROOT, d.name), assets = c.assets || {}
      out.push({ dir: d.name, title: zh.title || d.name, subtitle: zh.subtitle || '',
        hotspots: (c.hotspots || []).length, audio: (c.audio || []).length,
        hasPano: hasAssetFile(exDir, assets.panorama, ROOT),
        usesPanorama: (c.environment?.mode === 'panorama') && hasAssetFile(exDir, assets.panorama, ROOT),
        envMode: (c.environment && c.environment.mode) || '',
        // 背景分组只能按内容判断：路径既会误并（各展品自带的 assets/panorama.jpg
        // 其实是不同的图）也会误分（同一张图复制进多个目录）
        panoramaHash: assetFingerprint(exDir, assets.panorama, ROOT),
        // 工作台按这两项做「分组 / 待完善」筛选：模型是否真在盘上、当前用的是哪套背景
        hasModel: hasAssetFile(exDir, assets.model, ROOT),
        panorama: assets.panorama || '',
        envPreset: (c.environment && c.environment.preset) || 'room',
        poster: assets.poster ? d.name + '/' + assets.poster : '',
        mtime: fs.statSync(cp).mtimeMs })
    } catch (e) { out.push({ dir: d.name, title: d.name, error: String(e.message) }) }
  }
  return out.sort((a, b) => (b.mtime || 0) - (a.mtime || 0))
}

function saveConfig(ex, config, poster) {
  if (!SAFE.test(ex)) throw new Error('非法展品目录')
  const dir = path.join(ROOT, ex), cfgPath = path.join(dir, 'config.json')
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) throw new Error('展品目录不存在：' + ex)
  if (!config || typeof config !== 'object' || !config.assets || !config.assets.model) throw new Error('配置无效（缺 assets.model）')
  const bakDir = path.join(dir, '.bak'); fs.mkdirSync(bakDir, { recursive: true })
  if (fs.existsSync(cfgPath)) fs.copyFileSync(cfgPath, path.join(bakDir, 'config.' + Date.now() + '.json'))
  // 只保留最近 BAK_KEEP 份备份
  const baks = fs.readdirSync(bakDir).filter(f => f.startsWith('config.')).sort()
  while (baks.length > BAK_KEEP) fs.rmSync(path.join(bakDir, baks.shift()))
  // 缩略图（保存时自动刷新）：dataURL(jpeg) → assets/poster.jpg
  if (typeof poster === 'string' && poster.startsWith('data:image')) {
    const b64 = poster.slice(poster.indexOf(',') + 1)
    fs.mkdirSync(path.join(dir, 'assets'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'assets', 'poster.jpg'), Buffer.from(b64, 'base64'))
    config.assets.poster = 'assets/poster.jpg'
  }
  fs.writeFileSync(cfgPath, JSON.stringify(config, null, 2))
}

function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '')
  if (rel === '' ) rel = 'studio.html'
  if (rel.endsWith('/')) rel += 'index.html'
  const full = path.join(ROOT, rel)
  if (!full.startsWith(ROOT)) return send(res, 403, 'text/plain', 'forbidden')       // 目录穿越防护
  fs.readFile(full, (err, buf) => {
    if (err) return send(res, 404, 'text/plain; charset=utf-8', '404 Not Found: ' + rel)
    const ext = path.extname(full).toLowerCase()
    const cacheExtra = ext === '.json' ? NO_STORE : {}
    if (path.basename(full) === 'player.html') {                                      // 注入保存地址
      const injected = buf.toString('utf8').replace('</head>', '<script>window.__SAVE_API__="/studio-api/save"</script>\n</head>')
      return send(res, 200, MIME['.html'], injected, cacheExtra)
    }
    send(res, 200, MIME[ext] || 'application/octet-stream', buf, cacheExtra)
  })
}

http.createServer((req, res) => {
  const u = req.url || '/'
  if (u.startsWith('/studio-api/identity')) {
    if (isLocalhost(req)) return json(res, 200, getIdentityPayload(ROOT))
    if (!authed(req, res)) return
    return json(res, 200, getIdentityPayload(ROOT))
  }
  if (!authed(req, res)) return
  if (u.startsWith('/studio-api/list')) {
    try { return json(res, 200, { exhibits: listExhibits(), panoramas: listPanoramaCandidates(ROOT), capabilities: { save: true, create: true, batch: true } }) } catch (e) { return json(res, 500, { error: String(e.message) }) }
  }
  if (u.startsWith('/studio-api/create') && req.method === 'POST') {
    let body = ''
    req.on('data', c => { body += c; if (body.length > 1e6) req.destroy() })
    req.on('end', () => {
      try {
        const { dir, title, subtitle } = JSON.parse(body)
        const created = createExhibit(ROOT, { dir, title, subtitle })
        json(res, 200, { ok: true, ...created })
      } catch (e) { json(res, 400, { ok: false, error: String(e.message) }) }
    })
    return
  }
  if (u.startsWith('/studio-api/save') && req.method === 'POST') {
    let body = ''
    req.on('data', c => { body += c; if (body.length > 5e6) req.destroy() })
    req.on('end', () => {
      try { const { ex, config, poster } = JSON.parse(body); saveConfig(ex, config, poster); json(res, 200, { ok: true }) }
      catch (e) { json(res, 400, { ok: false, error: String(e.message) }) }
    })
    return
  }
  serveStatic(req, res, u)
}).listen(PORT, () => {
  console.log(`▶ 3D 鉴赏工作台服务：http://127.0.0.1:${PORT}/studio.html   ${PASS ? '(Basic Auth 已启用)' : '(无鉴权·仅本机)'}`)
  console.log(`   rootHash：${ROOT_HASH}`)
})
