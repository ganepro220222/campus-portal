/**
 * Create a new craft-XXX exhibit from _template/ (shared by CLI, API, tests).
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export const EXHIBIT_DIR_SAFE = /^[a-zA-Z0-9_-]+$/
/** Max ASCII digits in a numeric craft suffix (no int conversion). */
export const EXHIBIT_NUMERIC_MAX_DIGITS = 32

/** Strip leading zeros (keep one digit); pad to min 3 — never uses Number/int. */
export function normalizeNumericDirSuffix(digits) {
  if (!/^[0-9]+$/.test(digits)) throw new Error('非法展品编号')
  const trimmed = digits.replace(/^0+(?=\d)/, '') || '0'
  if (trimmed.length > EXHIBIT_NUMERIC_MAX_DIGITS) throw new Error('展品编号过长')
  return trimmed.padStart(3, '0')
}

function maxNumericSuffix(a, b) {
  const aa = BigInt(a.replace(/^0+(?=\d)/, '') || '0')
  const bb = BigInt(b.replace(/^0+(?=\d)/, '') || '0')
  return aa >= bb ? a.replace(/^0+(?=\d)/, '') || '0' : b.replace(/^0+(?=\d)/, '') || '0'
}

function incrementNumericSuffix(digits) {
  const n = BigInt(digits.replace(/^0+(?=\d)/, '') || '0') + 1n
  return n.toString().padStart(3, '0')
}

/** Escape text for HTML text/title context (config JSON keeps raw user input). */
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function normalizeExhibitDir(input) {
  let s = String(input ?? '').trim().replace(/^[/\\]+|[/\\]+$/g, '')
  if (!s) throw new Error('展品目录不能为空')
  if (/^\d+$/.test(s)) {
    s = `craft-${normalizeNumericDirSuffix(s)}`
  } else if (!/^craft-/i.test(s)) {
    s = `craft-${s}`
  }
  if (s === 'craft-' || !EXHIBIT_DIR_SAFE.test(s)) throw new Error('非法展品目录名：' + s)
  return s
}

export function suggestNextExhibitDir(root) {
  let max = '0'
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory() || name.name.startsWith('_') || name.name.startsWith('.')) continue
    const m = /^craft-(\d+)$/i.exec(name.name)
    if (m) max = maxNumericSuffix(max, m[1])
  }
  return `craft-${incrementNumericSuffix(max)}`
}

function validateTemplate(templateDir) {
  const cfgPath = path.join(templateDir, 'config.json')
  const idxPath = path.join(templateDir, 'index.html')
  if (!fs.existsSync(cfgPath)) throw new Error('模板缺少 config.json')
  if (!fs.existsSync(idxPath)) throw new Error('模板缺少 index.html')
  JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
}

function buildIndexHtml(templateIdx, ex, title) {
  return templateIdx.replaceAll('__EX__', ex).replaceAll('__TITLE__', escapeHtml(title))
}

export function createExhibit(root, { dir, title, subtitle = '' }) {
  const ex = normalizeExhibitDir(dir)
  const name = String(title ?? '').trim()
  if (!name) throw new Error('展品名称不能为空')
  const sub = String(subtitle ?? '').trim()

  const templateDir = path.join(root, '_template')
  const dest = path.join(root, ex)
  validateTemplate(templateDir)
  if (fs.existsSync(dest)) throw new Error('展品目录已存在：' + ex)

  const templateCfg = JSON.parse(fs.readFileSync(path.join(templateDir, 'config.json'), 'utf8'))
  const templateIdx = fs.readFileSync(path.join(templateDir, 'index.html'), 'utf8')

  templateCfg.id = ex
  templateCfg.i18n = templateCfg.i18n || {}
  templateCfg.i18n.zh = templateCfg.i18n.zh || {}
  templateCfg.i18n.zh.title = name
  templateCfg.i18n.zh.subtitle = sub

  const tmp = path.join(root, `._creating-${ex}-${crypto.randomBytes(4).toString('hex')}`)
  try {
    fs.cpSync(templateDir, tmp, { recursive: true })
    fs.writeFileSync(path.join(tmp, 'config.json'), JSON.stringify(templateCfg, null, 2) + '\n', 'utf8')
    fs.writeFileSync(path.join(tmp, 'index.html'), buildIndexHtml(templateIdx, ex, name), 'utf8')
    fs.renameSync(tmp, dest)
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true })
    throw e
  }

  return { dir: ex, title: name, subtitle: sub, assetsDir: `${ex}/assets` }
}
