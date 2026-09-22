#!/usr/bin/env node
/**
 * 拦「图标掉进自己的底色里」——写死在 wxml 上的图形颜色，
 * 和它落在的那块底色算对比度，低于 3:1 就红。
 *
 * 这不是假想的风险，是**已经发生过一次**的事：
 * 展馆/文创详情的兜底底色原来是深蓝紫渐变，上面压的是
 * rgba(255,255,255,.55) 的白色图形。把底色收进方案 A 换成浅绢之后，
 * 那几枚图形就从"白压深"变成了"白压白"——整块空白，没有任何报错，
 * 流水线全绿，只有人眼在真机上能发现。
 *
 * 之所以非得机器查：图形色写在 wxml 的属性里，底色写在 wxss 的类上，
 * 两边谁也不认识谁。改底色的人不会顺手去翻 wxml，
 * 而这两件事恰恰**总是**一起改——每收一页方案 A 就撞一次。
 *
 * 判据用 WCAG 2.1 对"非文本内容"（图形与界面部件）的 3:1。
 * 图标是要被认出来的图形，不是装饰，所以不放宽到 1.4.11 之外。
 *
 * 量不准的一律放行，只报"确定看不见"的：
 *   · 颜色是 {{…}} 表达式 —— 运行时才知道；
 *   · 底色是图片/渐变里带图片 —— 像素未知；
 *   · 一路找不到带背景的祖先 —— 背景来自 page{}，那是纸，很亮，
 *     浅色图标压在纸上照样会被这里算出来（祖先兜底就是 --paper）。
 * 渐变底按**所有色标里最糟的那一档**算：一枚图标横跨整条渐变，
 * 只要有一段看不见就是看不见。
 *
 * 用法：node scripts/check-icon-on-fill.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const MINI = path.join(ROOT, 'miniapp')
const APP = fs.readFileSync(path.join(MINI, 'app.wxss'), 'utf8')

const MIN_RATIO = 3          // WCAG 2.1 §1.4.11 非文本内容
const FAIL = []
const SEEN = { icons: 0, judged: 0 }

/* ── 颜色 ───────────────────────────────────────────── */

function parseColor (tx) {
  if (!tx) return null
  const s = tx.trim()
  let m = /^#([0-9a-fA-F]{3,8})$/.exec(s)
  if (m) {
    let h = m[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    if (h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('') +
                            h[3] + h[3]
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16),
            parseInt(h.slice(4, 6), 16), a]
  }
  m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s)
  if (m) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]]
  return null
}

/** 把带 alpha 的前景压到背景上，得到实际看到的那个颜色 */
function over (fg, bg) {
  const a = fg[3]
  return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)).concat(1)
}

function luminance (c) {
  const s = c.slice(0, 3).map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]
}

function contrast (fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

/* ── 令牌 ───────────────────────────────────────────── */

const TOKENS = {}
{
  // 令牌区里的 --x: #hex；令牌指向令牌的（--navy: var(--jin-70)）也跟着解开
  for (const m of APP.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) TOKENS[m[1]] = m[2].trim()
}
function resolveVar (tx, depth = 0) {
  if (depth > 6) return null
  const m = /^var\(\s*--([\w-]+)\s*(?:,[^)]*)?\)$/.exec(tx.trim())
  if (!m) return tx
  const v = TOKENS[m[1]]
  if (v === undefined) return null
  return resolveVar(v, depth + 1)
}

/* ── 从 wxss 里把「类名 → 这块底是什么颜色」抽出来 ───────── */

function stripComments (s) { return s.replace(/\/\*[\s\S]*?\*\//g, '') }

/**
 * 返回 Map<className, {stops: color[]} | 'unknown'>
 * 'unknown' 表示这个类确实设了背景，但我们算不准（图片等）——遇到就停下不判。
 */
function backgroundsOf (wxssList) {
  const map = new Map()
  for (const src of wxssList) {
    const css = stripComments(src)
    // 极简规则切分：`选择器 { 声明 }`，不处理嵌套（wxss 没有嵌套）
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = rule[1].trim()
      const body = rule[2]
      if (sel.startsWith('@')) continue
      const decls = [...body.matchAll(/(^|;)\s*(background(?:-color|-image)?)\s*:\s*([^;]+)/g)]
      if (!decls.length) continue

      let entry = null
      for (const d of decls) {
        const prop = d[2]
        const val = d[3].trim()
        // 值可能是 `var(--fiber)` 这种——url( 藏在令牌里，得先解开再判
        const flat = val.replace(/var\(\s*--([\w-]+)\s*\)/g,
          (mm, name) => (TOKENS[name] === undefined ? mm : TOKENS[name]))
        if (/url\(/.test(flat)) {
          // 本套的纹样（纤维、棂格、回纹、角叶）都是内嵌的 data:URI，
          // 而且都是几个百分点的噪声/细线——盖在底色上对对比度的影响可以忽略，
          // 所以有 background-color 时按底色算。
          // 真图片（照片封面）像素未知，一律 'unknown' 放行。
          if (prop === 'background-image' && isTexture(flat) && entry) continue
          entry = 'unknown'
          continue
        }
        const stops = gradientStops(val)
        if (stops) { entry = stops; continue }
        const c = colorOf(val.split(/\s+/)[0])
        entry = c ? [c] : 'unknown'
      }
      if (!entry) continue

      // 只认「单类」和「类.类」形式的选择器最后那一节的第一个类名
      for (const one of sel.split(',')) {
        const last = one.trim().split(/[\s>+~]+/).pop() || ''
        const cls = [...last.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1])
        if (!cls.length) continue
        // 伪元素画的是另一层，不是这个元素自己的底
        if (/::/.test(last)) continue
        // 状态类（:active / .on 这种第二个类）不覆盖静息态
        const key = cls[0]
        if (cls.length > 1 || /:/.test(last)) continue
        const prev = map.get(key)
        // 同一个类多条规则时，后面的覆盖前面的（和 CSS 一致）
        map.set(key, entry === 'unknown' || prev === 'unknown' ? entry : entry)
      }
    }
  }
  return map
}

/** 纹样令牌（--fiber / --lattice / --fret-* / --jiaoye-* …）都是内嵌 SVG */
function isTexture (flat) {
  // 内嵌 SVG 自己内部还会写 url(%23f) 指向滤镜，所以不能"每个 url( 都得是 data:"，
  // 只判**有没有指向真图片的 url**：本地路径或网络地址。
  if (!/url\(\s*["']?data:image\/svg\+xml/.test(flat)) return false
  return !/url\(\s*["']?(?:https?:|\/|\.\/|\.\.\/)/.test(flat)
}

function colorOf (tx) {
  if (!tx) return null
  const v = resolveVar(tx)
  if (v === null) return null
  if (/^(transparent|none|inherit|initial|currentcolor)$/i.test(v.trim())) return null
  return parseColor(v)
}

/** linear-gradient(...) → 所有能解析出来的色标；不是渐变返回 null */
function gradientStops (val) {
  if (!/gradient\(/i.test(val)) return null
  const inner = val.slice(val.indexOf('(') + 1, val.lastIndexOf(')'))
  const out = []
  // 逐段扫颜色字面量与 var()
  for (const m of inner.matchAll(/(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|var\(\s*--[\w-]+\s*\))/g)) {
    const c = colorOf(m[1])
    if (c) out.push(c)
  }
  return out.length ? out : null
}

/* ── 扫 wxml ─────────────────────────────────────────── */

const PAPER = parseColor(resolveVar('var(--paper)')) || [247, 243, 232, 1]

/**
 * class 串里常有 `{{…}}`。两种写法要分开对待，不然这条护栏不是漏报就是误报：
 *
 *   ① `{{playing ? 'rab-btn-on' : ''}}` —— **状态**。
 *      图标本身往往也只在其中一个状态下渲染（播放中才画暂停符），
 *      所以只要有一个状态下看得见就算过。
 *
 *   ② `{{item.colorClass}}` —— **轮换的变体**（hc1…hc5、gi1…gi3）。
 *      每一档都会真的出现，所以**每一档都得看得见**。
 *      名字不在 wxml 里，去这一页自己的 js、以及它 require 进来的本地模块里
 *      捞字符串字面量；只留那些在样式表里确实带底色的。
 *      捞不到就放行——宁可漏报，不能误报。
 */
function classSpec (raw) {
  const state = []        // ① 三元里出现的名字
  const fields = []       // ② 光秃秃的插值绑的是哪个字段
  let rest = raw
  for (const m of raw.matchAll(/\{\{([^}]*)\}\}/g)) {
    const body = m[1]
    const lits = [...body.matchAll(/'([^']*)'|"([^"]*)"/g)]
      .map((x) => (x[1] ?? x[2]).trim()).filter(Boolean)
    if (lits.length) state.push(...lits.flatMap((t) => t.split(/\s+/)))
    else {
      const f = /([A-Za-z_$][\w$]*)\s*$/.exec(body.trim())
      if (f) fields.push(f[1])
    }
    rest = rest.replace(m[0], ' ')
  }
  return { fixed: rest.split(/\s+/).filter(Boolean), state, fields }
}

/**
 * `{{item.cls}}` 里的名字要到 js 里去认。
 * 不能把整个 js 的字符串字面量一股脑当候选——一页 js 里常有好几组类名
 * （封面用 hc1…hc5、图集用 gi1…gi3），混在一起就会把"图集上的图标"
 * 拿去和"封面的深底"比，报一堆根本不存在的问题。
 *
 * 所以顺着**字段名**找：`{{item.cls}}` 认 `cls`，
 * 在这一页的 js 和它 require 进来的本地模块里找 `cls: <表达式>`，
 * 再从表达式里取名字，三种写法都认（实际就这三种）：
 *   · 直接写死       cls: 'gi1'
 *   · 指向一个数组   cls: COVER_CLASSES[i % COVER_CLASSES.length]
 *   · 前缀拼下标     cls: 'gi' + ((i % 3) + 1)
 * 一个都认不出来就放行。
 */
const fieldCache = new Map()
function jsSources (wxmlPath) {
  const dir = path.dirname(wxmlPath)
  const main = path.join(dir, path.basename(wxmlPath, '.wxml') + '.js')
  const out = []
  if (!fs.existsSync(main)) return out
  out.push(fs.readFileSync(main, 'utf8'))
  for (const m of out[0].matchAll(/require\(\s*'(\.[^']*)'\s*\)/g)) {
    let dep = path.resolve(dir, m[1])
    if (!dep.endsWith('.js')) dep += '.js'
    if (dep.startsWith(MINI) && fs.existsSync(dep)) out.push(fs.readFileSync(dep, 'utf8'))
  }
  return out
}

function candidatesForField (wxmlPath, field, bg) {
  const key = wxmlPath + '::' + field
  if (fieldCache.has(key)) return fieldCache.get(key)
  const names = new Set()
  for (const src of jsSources(wxmlPath)) {
    for (const m of src.matchAll(new RegExp('\\b' + field + '\\s*:\\s*([^,\\n}]+)', 'g'))) {
      const rhs = m[1]
      for (const q of rhs.matchAll(/'([A-Za-z][\w-]*)'|"([A-Za-z][\w-]*)"/g)) {
        const lit = q[1] ?? q[2]
        // 'gi' + (...) 这种前缀拼法：把样式表里同前缀带数字的全算上
        if (/['"]\s*\+/.test(rhs.slice(q.index))) {
          for (const c of bg.keys()) if (new RegExp('^' + lit + '\\d+$').test(c)) names.add(c)
        }
        names.add(lit)
      }
      for (const id of rhs.matchAll(/\b([A-Z][A-Z0-9_]{2,})\b/g)) {
        for (const src2 of jsSources(wxmlPath)) {
          const arr = new RegExp('\\b' + id[1] + '\\s*=\\s*\\[([^\\]]*)\\]').exec(src2)
          if (!arr) continue
          for (const q of arr[1].matchAll(/'([^']*)'|"([^"]*)"/g)) names.add((q[1] ?? q[2]).trim())
        }
      }
    }
  }
  const out = [...names].filter((n) => bg.has(n))
  fieldCache.set(key, out)
  return out
}

function scan (wxmlPath) {
  const src = fs.readFileSync(wxmlPath, 'utf8')
  const dir = path.dirname(wxmlPath)
  const own = path.join(dir, path.basename(wxmlPath, '.wxml') + '.wxss')
  const sheets = [APP]
  if (fs.existsSync(own)) sheets.push(fs.readFileSync(own, 'utf8'))
  const bg = backgroundsOf(sheets)
  const rel = path.relative(MINI, wxmlPath).split(path.sep).join('/')

  const stack = []
  const tagRe = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g
  let m
  while ((m = tagRe.exec(src))) {
    const [, close, tag, attrs, selfClose] = m
    if (close) { if (stack.length) stack.pop(); continue }

    const clsM = /\bclass\s*=\s*"([^"]*)"/.exec(attrs)
    const spec = clsM ? classSpec(clsM[1]) : { fixed: [], state: [], fields: [] }
    const frame = { tag, spec }

    if (tag === 'icon') {
      SEEN.icons++
      const colM = /\bcolor\s*=\s*"([^"]*)"/.exec(attrs)
      if (colM && !/\{\{/.test(colM[1])) {
        const fg = parseColor(colM[1])
        if (fg) check(rel, line(src, m.index), colM[1], fg, [...stack, frame], bg, wxmlPath)
      }
    }

    if (!selfClose && !/^(image|input|icon|text|wxs|import|include)$/.test(tag)) stack.push(frame)
  }
}

function line (src, idx) { return src.slice(0, idx).split('\n').length }

/** 这一层元素落在什么底上：返回 {mode, stops[]} 或 null（这一层说不清，往上找） */
function layerBg (frame, bg, wxmlPath) {
  const withBg = (names) => names.map((n) => bg.get(n)).filter(Boolean)

  // ② 变体：名字顺着字段名从 js 里找，每一档都得过
  if (frame.spec.fields.length) {
    const cand = frame.spec.fields.flatMap((f) => candidatesForField(wxmlPath, f, bg))
    const es = withBg(frame.spec.fixed.concat(cand))
    if (es.length) return { mode: 'all', es }
  }
  // ① 状态：静息 + 各状态里只要有一个看得见就算过
  const es = withBg(frame.spec.fixed.concat(frame.spec.state))
  if (es.length) return { mode: frame.spec.state.length ? 'any' : 'all', es }
  return null
}

function check (rel, ln, raw, fg, frames, bg, wxmlPath) {
  for (let i = frames.length - 1; i >= 0; i--) {
    // 一路都没有带底色的祖先时，兜底就是 page{} 那张纸——
    // 这正是最该查的一档：浅色图标压在纸上就是看不见。
    const layer = i === 0
      ? (layerBg(frames[0], bg, wxmlPath) || { mode: 'all', es: [[PAPER]] })
      : layerBg(frames[i], bg, wxmlPath)
    if (!layer) continue
    if (layer.es.includes('unknown')) return      // 底是图片：量不准，放行
    SEEN.judged++
    let worst = Infinity, worstBg = null, best = 0
    for (const stops of layer.es) {
      for (const stop of stops) {
        const solid = stop[3] < 1 ? over(stop, PAPER) : stop
        const shown = fg[3] < 1 ? over(fg, solid) : fg
        const r = contrast(shown, solid)
        if (r < worst) { worst = r; worstBg = solid }
        if (r > best) best = r
      }
    }
    const ok = layer.mode === 'any' ? best >= MIN_RATIO : worst >= MIN_RATIO
    if (!ok) FAIL.push({ rel, ln, raw, ratio: layer.mode === 'any' ? best : worst, bg: worstBg })
    return
  }
}

/* ── 跑 ──────────────────────────────────────────────── */

function walk (d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (!/node_modules|miniprogram_npm/.test(e.name)) walk(p, out) }
    else if (e.name.endsWith('.wxml')) out.push(p)
  }
  return out
}

for (const f of walk(MINI)) scan(f)

if (FAIL.length) {
  console.error('check-icon-on-fill 发现问题：图标颜色掉进了它自己的底色里\n')
  for (const f of FAIL) {
    const hex = '#' + f.bg.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
    console.error(`  ✗ ${f.rel}:${f.ln}  color="${f.raw}" 落在 ≈${hex} 的底上，` +
                  `对比度只有 ${f.ratio.toFixed(2)}:1，要求 ≥${MIN_RATIO}`)
  }
  console.error('\n  改底色的时候，wxml 里压在上面的图形色要跟着改。')
  process.exit(1)
}
console.log(`check-icon-on-fill OK（扫了 ${SEEN.icons} 枚图标，其中 ${SEEN.judged} 枚能定位到底色并已量过）`)
