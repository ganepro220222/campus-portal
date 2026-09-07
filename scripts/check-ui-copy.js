#!/usr/bin/env node
/**
 * 界面文案检查 —— 拦「写给自己人看的话出现在交付界面上」。
 *
 * 这些都是真出过的：
 *   - 后台首页轮播：「保存后小程序端可在缓存刷新后展示（**验收标准**：5 分钟内同步）」
 *   - 后台操作日志：「……满足**验收**「操作有日志」」
 *   - 后台关联小程序：「「接口同步」为预留能力，待**甲方** API 文档到位后对接」，
 *     后面还跟着让用户去复制 json 模板、执行 node 脚本
 *   - 展馆编辑：「（**验收 §2.4**）」
 *   - 接口下发给小程序的类型标签：「接口同步（**预留**）」
 *
 * 甲方和审核员看到的是界面，不是我们的验收表和排期。合同术语、内部路线图、
 * 命令行指引都不该出现在这里。
 *
 * 扫描范围：只看**会渲染出来的文字**
 *   - admin/src 下 .vue 的 <template> 文本节点，以及 label / placeholder / title 等属性
 *   - miniapp 下 .wxml 的文本节点与 placeholder
 *   - miniapp 下 .js 的 showModal / showToast / showActionSheet 文案（先剥注释，排除 *.test.js）
 *   注释一律先剔除（注释里写「生产环境不得……」是应该的）。
 *
 * 用法：node scripts/check-ui-copy.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

const BANNED = [
  ['验收', '合同/验收术语，属于我们和甲方之间的约定，不是给使用者看的'],
  ['甲方', '当着客户的面把客户称作「甲方」'],
  ['乙方', '同上'],
  ['开发环境', '环境说明属于部署文档；确需只在开发构建显示，请用 v-if="isDev" 之类的条件渲染'],
  ['生产环境', '同上'],
  ['预留', '内部路线图措辞；对使用者应说明「暂未开放」还是「即将上线」'],
  ['一期', '排期术语'],
  ['二期', '排期术语'],
  ['本期', '排期术语'],
  ['待实现', '把未完成状态直接写在界面上'],
  ['需求文档', '内部文档名'],
  ['技术方案', '内部文档名'],
  ['联调', '开发术语'],
  ['压测', '开发术语'],
  ['占位符', '开发术语'],
  ['TODO', '开发标记'],
  ['FIXME', '开发标记'],
  ['mock', '开发术语'],
  ['Mock', '开发术语']
]

/*
 * 例外。只放**确实是正常业务用语**、恰好撞上关键词的整句，
 * 不要拿它来放行真正的内部措辞。
 */
const ALLOW = [
  // 报名名额的「占位」是业务动作，与开发术语无关（这里匹配的是「占位」不在词表里，留作示例）
]

function walk(dir, exts, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full, exts, out)
    else if (exts.some((e) => name.endsWith(e))) out.push(full)
  }
  return out
}

/** 取 .vue 的 <template> 段；取不到就整份文件退而求其次 */
function templateOf(src) {
  const m = src.match(/<template>([\s\S]*)<\/template>/)
  return m ? m[1] : src
}

/** 抹掉注释（保留换行与偏移，行号才对得上） */
function stripComments(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
}

/** JS 注释：双斜杠与块注释。字符串内的斜杠不剥。长度与换行保持，方便对回原文件行号。 */
function stripJsComments(src) {
  let out = ''
  let i = 0
  const n = src.length
  while (i < n) {
    const c = src[i]
    const next = src[i + 1]
    if (c === '"' || c === "'" || c === '`') {
      const q = c
      out += c
      i += 1
      while (i < n) {
        const ch = src[i]
        out += ch
        if (ch === '\\') {
          out += src[i + 1] || ''
          i += 2
          continue
        }
        i += 1
        if (ch === q) break
      }
      continue
    }
    if (c === '/' && next === '/') {
      while (i < n && src[i] !== '\n') {
        out += ' '
        i += 1
      }
      continue
    }
    if (c === '/' && next === '*') {
      out += '  '
      i += 2
      while (i < n) {
        if (src[i] === '*' && src[i + 1] === '/') {
          out += '  '
          i += 2
          break
        }
        out += src[i] === '\n' ? '\n' : ' '
        i += 1
      }
      continue
    }
    out += c
    i += 1
  }
  return out
}

function extractBalancedObject(s, openIdx) {
  let depth = 0
  let i = openIdx
  let quote = null
  while (i < s.length) {
    const c = s[i]
    if (quote) {
      if (c === '\\') {
        i += 2
        continue
      }
      if (c === quote) quote = null
      i += 1
      continue
    }
    if (c === '"' || c === "'" || c === '`') {
      quote = c
      i += 1
      continue
    }
    if (c === '{') depth += 1
    else if (c === '}') {
      depth -= 1
      if (depth === 0) return s.slice(openIdx, i + 1)
    }
    i += 1
  }
  return s.slice(openIdx)
}

function dialogChunksFromJs(src) {
  const s = stripJsComments(src)
  const out = []
  const callRe = /\b(?:wx\.)?(?:showModal|showToast|showActionSheet)\s*\(\s*\{/g
  let m
  while ((m = callRe.exec(s))) {
    const objStart = s.indexOf('{', m.index)
    if (objStart < 0) continue
    const obj = extractBalancedObject(s, objStart)
    const keyRe = /\b(?:title|content|confirmText|cancelText)\s*:\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g
    let km
    while ((km = keyRe.exec(obj))) {
      out.push({ at: objStart + km.index, text: km[2].replace(/\\n/g, ' ') })
    }
  }
  return out
}

/** 会渲染出来的片段：标签之外的文本 + 若干文案类属性的值 */
function visibleChunks(src) {
  const s = stripComments(src)
  const out = []
  let idx = 0
  for (const m of s.matchAll(/<[^>]*>/g)) {
    if (m.index > idx) out.push({ at: idx, text: s.slice(idx, m.index) })
    idx = m.index + m[0].length
  }
  if (idx < s.length) out.push({ at: idx, text: s.slice(idx) })

  const ATTR = /\b(?:label|placeholder|title|content|description|confirm-button-text|cancel-button-text)="([^"{}]*)"/g
  for (const m of s.matchAll(ATTR)) out.push({ at: m.index, text: m[1] })
  return out
}

function lineOf(src, offset) {
  return src.slice(0, offset).split('\n').length
}

function scan(file, extract) {
  const raw = fs.readFileSync(file, 'utf8')
  const rel = path.relative(root, file)
  const errs = []
  for (const chunk of visibleChunks(extract(raw))) {
    const text = chunk.text.replace(/\{\{[\s\S]*?\}\}/g, '')
    if (!text.trim()) continue
    if (ALLOW.some((a) => text.includes(a))) continue
    for (const [word, why] of BANNED) {
      if (text.includes(word)) {
        const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 60)
        errs.push(`${rel}:${lineOf(raw, chunk.at)}  界面上出现「${word}」——${why}\n      → ${snippet}`)
        break
      }
    }
  }
  return errs
}

function shouldScanMiniappJs(file) {
  const name = path.basename(file)
  if (name.endsWith('.test.js')) return false
  const rel = path.relative(root, file).split(path.sep).join('/')
  if (rel.includes('/mock/')) return false
  return true
}

function scanJsDialogs(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const rel = path.relative(root, file)
  const errs = []
  for (const chunk of dialogChunksFromJs(raw)) {
    const text = chunk.text
    if (!text.trim()) continue
    if (ALLOW.some((a) => text.includes(a))) continue
    for (const [word, why] of BANNED) {
      if (text.includes(word)) {
        const snippet = text.trim().replace(/\s+/g, ' ').slice(0, 60)
        errs.push(`${rel}:${lineOf(raw, chunk.at)}  弹窗文案出现「${word}」——${why}\n      → ${snippet}`)
        break
      }
    }
  }
  return errs
}

function collectCopyErrors() {
  return [
    ...walk(path.join(root, 'admin/src'), ['.vue']).flatMap((f) => scan(f, templateOf)),
    ...walk(path.join(root, 'miniapp'), ['.wxml']).flatMap((f) => scan(f, (s) => s)),
    ...walk(path.join(root, 'miniapp'), ['.js']).filter(shouldScanMiniappJs).flatMap(scanJsDialogs)
  ]
}

function main() {
  const errs = collectCopyErrors()
  if (errs.length) {
    console.error('check-ui-copy 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  console.log('check-ui-copy OK（后台 .vue 模板、小程序 .wxml 与 JS 弹窗文案未出现内部措辞）')
}

if (require.main === module) {
  main()
}

module.exports = {
  stripJsComments,
  dialogChunksFromJs,
  shouldScanMiniappJs,
  collectCopyErrors,
  main
}
