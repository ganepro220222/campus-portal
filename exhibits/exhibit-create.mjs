/**
 * Create a new craft-XXX exhibit from _template/ (shared by CLI, API, tests).
 */
import fs from 'node:fs'
import path from 'node:path'

export const EXHIBIT_DIR_SAFE = /^[a-zA-Z0-9_-]+$/

export function normalizeExhibitDir(input) {
  let s = String(input ?? '').trim().replace(/^\/+|\/+$/g, '')
  if (!s) throw new Error('展品目录不能为空')
  if (/^\d+$/.test(s)) s = `craft-${s.padStart(3, '0')}`
  else if (!/^craft-/i.test(s)) s = `craft-${s}`
  if (!EXHIBIT_DIR_SAFE.test(s)) throw new Error('非法展品目录名：' + s)
  return s
}

export function suggestNextExhibitDir(root) {
  let max = 0
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name.startsWith('_') || name.name.startsWith('.')) continue
    const m = /^craft-(\d+)$/i.exec(name.name)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `craft-${String(max + 1).padStart(3, '0')}`
}

export function createExhibit(root, { dir, title, subtitle = '' }) {
  const ex = normalizeExhibitDir(dir)
  const name = String(title ?? '').trim()
  if (!name) throw new Error('展品名称不能为空')
  const sub = String(subtitle ?? '').trim()

  const templateDir = path.join(root, '_template')
  const dest = path.join(root, ex)
  if (!fs.existsSync(templateDir)) throw new Error('缺少模板目录 _template/')
  if (fs.existsSync(dest)) throw new Error('展品目录已存在：' + ex)

  fs.cpSync(templateDir, dest, { recursive: true })

  const cfgPath = path.join(dest, 'config.json')
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  cfg.id = ex
  cfg.i18n = cfg.i18n || {}
  cfg.i18n.zh = cfg.i18n.zh || {}
  cfg.i18n.zh.title = name
  cfg.i18n.zh.subtitle = sub
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8')

  const idxPath = path.join(dest, 'index.html')
  const idx = fs.readFileSync(idxPath, 'utf8').replaceAll('__EX__', ex).replaceAll('__TITLE__', name)
  fs.writeFileSync(idxPath, idx, 'utf8')

  return { dir: ex, title: name, subtitle: sub, assetsDir: path.join(dest, 'assets') }
}
