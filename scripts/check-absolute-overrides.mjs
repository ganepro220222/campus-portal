/**
 * 护栏：绝对定位的装饰件不能被 `父 > *` 这类通配规则打回文档流。
 *
 * 这一类 bug 踩过三次：`.banner > *:not(svg)`、`.hero > *:not(.qinglv)`、
 * `.banner > *:not(.ban-shan)` —— 写的时候是为了"把内容抬到画上面"，
 * 但它的选择器权重高于 .tag-v / .silk 自己的规则，于是竖排题签被压成一条横带。
 * 静态扫 CSS 判不准，所以在真浏览器里量计算值。
 */
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
if (!existsSync(CHROME)) {
  console.log('跳过：本机没有设计稿浏览器环境')
  process.exit(0)
}
const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')

// 自带一台预览服务：设计稿里的相对路径要从 design/ 根起算，
// file:// 下字体和素材会被浏览器挡掉，所以必须走 http。
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'design')
const PORT = 8000 + Math.floor(Math.random() * 900)
const server = spawn('python3', ['-m', 'http.server', String(PORT)],
                     { cwd: ROOT, stdio: 'ignore' })
const stop = () => { try { server.kill() } catch {} }
process.on('exit', stop); process.on('SIGINT', () => { stop(); process.exit(1) })
await new Promise(r => setTimeout(r, 900))

const BASE = `http://127.0.0.1:${PORT}/demo/v2`
const PAGES = ['home', 'home-cover', 'home-indigo', 'news-detail', 'news-detail-cover']
// 选择器 → 期望的 position
const MUST_BE_ABSOLUTE = ['.tag-v', '.qinglv', '.ban-shan', '.hero-mount', '.mount-art > img.cover']

const b = await chromium.launch({ executablePath: CHROME })
const p = await (await b.newContext({ viewport: { width: 375, height: 900 } })).newPage()
let bad = 0, checked = 0
for (const f of PAGES) {
  const res = await p.goto(`${BASE}/${f}.html`, { waitUntil: 'domcontentloaded' }).catch(() => null)
  if (!res || !res.ok()) { console.log(`  – ${f}.html 打不开，跳过`); continue }
  for (const sel of MUST_BE_ABSOLUTE) {
    const rows = await p.$$eval(sel, els => els.map(e => getComputedStyle(e).position))
    for (const pos of rows) {
      checked++
      if (pos !== 'absolute') {
        bad++
        console.log(`✗ ${f}.html  ${sel} 的 position 是 ${pos}，应为 absolute` +
                    `\n    多半是某条 \`父 > *\` 的规则把它打回了文档流`)
      }
    }
  }
}
await b.close()
stop()
if (!checked) { console.log('✗ 一个元素都没量到——预览服务没起？'); process.exit(1) }
if (bad) process.exit(1)
console.log(`✓ 绝对定位的装饰件没有被通配规则打回（量了 ${checked} 处）`)
