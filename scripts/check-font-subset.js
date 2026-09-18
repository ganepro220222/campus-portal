#!/usr/bin/env node
/**
 * 内嵌宋体子集的护栏，四件事：
 *
 * 0. app.wxss 必须真的 @import 了字体产物，.serif 也必须真的排到 ShuyuanSong。
 *    这条是补上的：前面三条全绿过一段时间，可那会儿 app.wxss 根本没 import，
 *    字体躺在包里没生效，.serif 一路退回系统字——护栏是空过的。
 *    「产物没问题」和「产物接上了」是两件事，都得量。
 *
 * 1. miniapp/styles/font-shuyuan-song.wxss 必须和 design/fonts/shuyuan-serif-400.woff2 一致
 *    （防止有人改了源字体却忘了重新生成，或反过来手改产物）。
 *
 * 2. 小程序里**写死的**中文，必须每个字都在子集里。
 *    子集外的字会逐字回退到系统字，同一行里出现两种字形——静态文案这一块必须 100% 命中。
 *    动态内容（资讯标题、课程名）保证不了，那部分靠字集覆盖率兜底（实测语料 99.8%+）。
 *
 * 3. 主包体积必须留有余量。字体是一次性、永久占用主包的，越界了整个包发不出去。
 *
 * 注意：JS / WXSS / WXML 里的注释都不参与校验（注释不会渲染给用户），
 * 避免写个注释就把护栏搞红。
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MINIAPP = path.join(ROOT, 'miniapp')
const CHARSET = path.join(ROOT, 'design/fonts/subset-charset.txt')
const MAIN_PACKAGE_LIMIT = 2 * 1024 * 1024   // 微信：主包上限 2MB
const MIN_HEADROOM = 200 * 1024              // 至少给后续改版留 200KB

const SUB_PACKAGE_ROOTS = ['packageA', 'packageB', 'packageC', 'packageD']
const SKIP_DIRS = new Set([...SUB_PACKAGE_ROOTS, 'node_modules', '__tests__', 'coverage'])
const CN = /[一-鿿]/g

const errors = []

/* ── 1. 产物与源字体一致 ── */
function checkGenerated() {
  const { execFileSync } = require('child_process')
  try {
    execFileSync(process.execPath, [path.join(__dirname, 'build-font-subset.js'), '--check'], { stdio: 'pipe' })
    console.log('✓ 字体 WXSS 与源字体一致')
  } catch (e) {
    // 空 Buffer 也是 truthy，必须看长度，否则报错信息会是一片空白
    const pick = [e.stderr, e.stdout].find((b) => b && b.length)
    errors.push(pick ? pick.toString().trim() : '✗ 字体产物校验失败（子进程无输出）')
  }
}

/* ── 2. 静态中文全部在子集内 ── */
function stripJsComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n')
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walk(full, out)
    } else {
      out.push(full)
    }
  }
  return out
}

/**
 * 显式豁免：文件里写 font-subset-allow: 魑魍魉
 * 只给「故意要展示回退效果」这类场景用（字体自检页就是），别拿它掩盖真问题。
 */
function allowedInFile(text) {
  const allowed = new Set()
  for (const m of text.matchAll(/font-subset-allow:\s*([^\s*/\->]+)/g)) {
    for (const ch of m[1]) allowed.add(ch)
  }
  return allowed
}

function checkStaticText(subset) {
  // 静态文案遍及主包与全部分包，一个都不能漏
  const files = []
  walk(MINIAPP, files)
  for (const root of SUB_PACKAGE_ROOTS) {
    const dir = path.join(MINIAPP, root)
    if (fs.existsSync(dir)) walk(dir, files)
  }

  const missing = new Map()   // 字 → 首次出现的位置
  let scanned = 0
  for (const file of files) {
    const ext = path.extname(file)
    if (!['.wxml', '.json', '.js', '.wxss'].includes(ext)) continue
    if (file.endsWith('.test.js') || file.endsWith('.test.json')) continue
    if (file.includes(`${path.sep}mock${path.sep}`)) continue
    const raw = fs.readFileSync(file, 'utf8')
    const allowed = allowedInFile(raw)
    let text = raw
    if (ext === '.js') text = stripJsComments(text)
    if (ext === '.wxss') text = text.replace(/\/\*[\s\S]*?\*\//g, '')
    // wxml 的注释同理——注释不渲染给用户。
    // 漏了这一条的代价是真出现过：在组件注释里写了个「绺」（玉石的纹理），
    // 护栏就红了，而那个字根本不会显示出来。
    if (ext === '.wxml') text = text.replace(/<!--[\s\S]*?-->/g, '')
    scanned++
    for (const ch of text.match(CN) || []) {
      if (subset.has(ch) || allowed.has(ch)) continue
      if (!missing.has(ch)) missing.set(ch, path.relative(ROOT, file))
    }
  }

  if (missing.size) {
    const list = [...missing].map(([ch, where]) => `    「${ch}」 ${where}`).join('\n')
    errors.push(
      `✗ ${missing.size} 个写死的汉字不在宋体子集内，这些字会退回系统字、和周围字形不一致：\n${list}\n` +
      `    修法：把这些字补进 design/fonts/subset-charset.txt，重新子集化字体后执行 node scripts/build-font-subset.js`
    )
  } else {
    console.log(`✓ 静态中文全部命中子集（扫描 ${scanned} 个文件，子集 ${subset.size} 字符）`)
  }
}

/* ── 3. 主包体积余量 ── */
function mainPackageSize() {
  const files = walk(MINIAPP)
  let total = 0
  for (const file of files) {
    const base = path.basename(file)
    if (file.endsWith('.test.js') || file.endsWith('.test.json')) continue
    if (['package.json', 'package-lock.json', 'jest.config.js'].includes(base)) continue
    total += fs.statSync(file).size
  }
  return total
}

function checkSize() {
  const size = mainPackageSize()
  const headroom = MAIN_PACKAGE_LIMIT - size
  const kb = (n) => `${(n / 1024).toFixed(0)} KB`
  if (headroom < 0) {
    errors.push(`✗ 主包 ${kb(size)} 已超过 2MB 上限，包发不出去`)
  } else if (headroom < MIN_HEADROOM) {
    errors.push(`✗ 主包 ${kb(size)}，只剩 ${kb(headroom)} 余量（要求至少 ${kb(MIN_HEADROOM)}）`)
  } else {
    console.log(`✓ 主包 ${kb(size)} / 2048 KB，余量 ${kb(headroom)}`)
  }
}

/* ── 0. 字体真的接通了吗 ── */
function checkWiredIn() {
  const appWxss = path.join(MINIAPP, 'app.wxss')
  if (!fs.existsSync(appWxss)) {
    errors.push('✗ 找不到 miniapp/app.wxss')
    return
  }
  const src = fs.readFileSync(appWxss, 'utf8')
  const imported = /@import\s+["']styles\/font-shuyuan-song\.wxss["']/.test(src)
  if (!imported) {
    errors.push('✗ app.wxss 没有 @import "styles/font-shuyuan-song.wxss"，' +
                '字体躺在包里但没生效，.serif 会一路退回系统字')
  }
  // .serif 的字体栈第一位必须是 ShuyuanSong，否则接了也白接
  const m = src.match(/\.serif\s*\{[^}]*font-family:\s*([^;}]+)/)
  if (!m) {
    errors.push('✗ app.wxss 里找不到 .serif 的字体栈')
  } else if (!/^\s*["']?ShuyuanSong["']?/.test(m[1])) {
    errors.push(`✗ .serif 的字体栈第一位不是 ShuyuanSong，现在是：${m[1].trim()}`)
  }
  if (imported && m && /^\s*["']?ShuyuanSong["']?/.test(m[1])) {
    console.log('✓ app.wxss 已 @import 字体产物，.serif 首选 ShuyuanSong')
  }
}

function main() {
  if (!fs.existsSync(CHARSET)) {
    console.error(`✗ 找不到字集清单 ${path.relative(ROOT, CHARSET)}`)
    process.exit(1)
  }
  const subset = new Set([...fs.readFileSync(CHARSET, 'utf8')])

  checkWiredIn()
  checkGenerated()
  checkStaticText(subset)
  checkSize()

  if (errors.length) {
    console.error('\n' + errors.join('\n'))
    process.exit(1)
  }
  console.log('\n内嵌宋体子集检查通过')
}

main()
