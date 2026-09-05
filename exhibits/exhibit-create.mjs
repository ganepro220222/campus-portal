/**
 * Create a new craft-XXX exhibit from _template/ (shared by CLI, API, tests).
 */
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

export const EXHIBIT_DIR_SAFE = /^[a-zA-Z0-9_-]+$/
/** Max ASCII digits in a numeric craft suffix (no int conversion). */
export const EXHIBIT_NUMERIC_MAX_DIGITS = 32

/** Strip leading zeros (keep one digit); pad to min 3 — never uses Number/int. */
export function normalizeNumericDirSuffix(digits) {
  if (!/^[0-9]+$/.test(digits)) throw new Error('非法展品编号')
  if (digits.length > EXHIBIT_NUMERIC_MAX_DIGITS) throw new Error('展品编号过长')
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
  const trimmed = digits.replace(/^0+(?=\d)/, '') || '0'
  const next = (BigInt(trimmed) + 1n).toString()
  return normalizeNumericDirSuffix(next)
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
  } else {
    const prefixedNumeric = /^craft-([0-9]+)$/i.exec(s)
    if (prefixedNumeric) {
      s = `craft-${normalizeNumericDirSuffix(prefixedNumeric[1])}`
    } else if (!/^craft-/i.test(s)) {
      s = `craft-${s}`
    }
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

export const CONTENT_DIR_SHARED_BG = '共享背景'
const DEFAULT_CHOWN_HELPER = '/usr/local/sbin/chown-exhibit-content-dir'

/** Top-level dirs File Browser may delete (sticky exhibits root). */
export function isHandoffContentDirName(name) {
  const s = String(name ?? '')
  return s === CONTENT_DIR_SHARED_BG || /^craft-[A-Za-z0-9_-]+$/.test(s)
}

export function resolveContentOwnerSpec(env = process.env) {
  const uidRaw = String(env.CONTENT_OWNER_UID || env.FILEBROWSER_UID || '').trim()
  if (!uidRaw) return null
  if (!/^[1-9][0-9]*$/.test(uidRaw)) throw new Error('非法 CONTENT_OWNER_UID / FILEBROWSER_UID')
  const uid = Number(uidRaw)
  if (!Number.isSafeInteger(uid) || uid === 0) throw new Error('内容目录属主不能为 root')
  const gidRaw = String(env.EXHIBITS_GROUP || '').trim()
  let gid = null
  if (gidRaw) {
    if (!/^[1-9][0-9]*$/.test(gidRaw)) throw new Error('非法 EXHIBITS_GROUP')
    gid = Number(gidRaw)
    if (!Number.isSafeInteger(gid) || gid === 0) throw new Error('EXHIBITS_GROUP 不能为 0')
  }
  return { uid, gid }
}

function applyNewContentModes(dest) {
  if (process.platform !== 'linux') return
  const walk = (p) => {
    let st
    try { st = fs.lstatSync(p) } catch { return }
    if (st.isSymbolicLink()) return
    try {
      if (st.isDirectory()) {
        fs.chmodSync(p, 0o2775)
        for (const name of fs.readdirSync(p)) walk(path.join(p, name))
      } else if (st.isFile()) {
        fs.chmodSync(p, 0o664)
      }
    } catch {
      /* Windows-like FS or no chmod; ownership handoff still matters on Linux */
    }
  }
  walk(dest)
}

function assertDirectContentChild(root, name) {
  if (!isHandoffContentDirName(name)) throw new Error('非法内容目录名：' + name)
  if (name.includes('/') || name.includes('\\') || name.includes('..')) {
    throw new Error('非法内容目录名：' + name)
  }
  const rootAbs = path.resolve(root)
  const dest = path.resolve(rootAbs, name)
  if (path.dirname(dest) !== rootAbs) throw new Error('内容目录必须在 exhibits 根下')
  return dest
}

/**
 * After Studio creates a craft-* dir, sticky exhibits root only lets File Browser
 * unlink it if the inode owner is FILEBROWSER_UID. Try fs.chown, else sudo helper.
 */
export function handoffExhibitContentOwner(root, name, opts = {}) {
  if (process.platform === 'win32') return { ok: true, skipped: 'win32' }
  const env = opts.env ?? process.env
  const spec = opts.spec !== undefined ? opts.spec : resolveContentOwnerSpec(env)
  if (!spec) return { ok: true, skipped: 'no-owner' }

  const dest = assertDirectContentChild(root, name)
  const st = fs.lstatSync(dest)
  if (st.isSymbolicLink() || !st.isDirectory()) throw new Error('拒绝移交非目录或符号链接')

  const rootReal = fs.realpathSync(root)
  const destReal = fs.realpathSync(dest)
  if (path.dirname(destReal) !== rootReal) throw new Error('内容目录必须在 exhibits 根下')

  const gid = spec.gid ?? st.gid
  if (st.uid === spec.uid && st.gid === gid) return { ok: true, skipped: 'already-owner' }

  try {
    fs.chownSync(dest, spec.uid, gid)
    fs.chmodSync(dest, 0o2775)
    return { ok: true, method: 'chown' }
  } catch (e) {
    const denied = e && (e.code === 'EPERM' || e.code === 'EACCES')
    if (!denied) throw e
  }

  const helper = opts.helper || env.EXHIBITS_CHOWN_HELPER || DEFAULT_CHOWN_HELPER
  const sudoBin = opts.sudo || env.EXHIBITS_CHOWN_SUDO || 'sudo'
  const args = [
    '-n', '--', helper,
    '--root', rootReal,
    '--name', name,
    '--uid', String(spec.uid),
    '--gid', String(gid),
  ]
  const r = spawnSync(sudoBin, args, { encoding: 'utf8' })
  if (r.status === 0) return { ok: true, method: 'sudo-helper' }
  const detail = String(r.stderr || r.stdout || `exit ${r.status}`).trim()
  throw new Error('无法把新建展品目录交给 File Browser：' + detail)
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

export function createExhibit(root, { dir, title, subtitle = '', handoffOwner } = {}) {
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

  applyNewContentModes(dest)
  if (handoffOwner !== false) {
    try {
      handoffExhibitContentOwner(root, ex)
    } catch (e) {
      const required = process.env.EXHIBITS_CHOWN_REQUIRED === '1' || handoffOwner === true
      if (required) throw e
      console.error('[exhibit-create]', e.message)
    }
  }

  return { dir: ex, title: name, subtitle: sub, assetsDir: `${ex}/assets` }
}
