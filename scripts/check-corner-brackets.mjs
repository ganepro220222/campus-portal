/**
 * 护栏：图片框四角的角叶。
 *
 * 由来：这件东西被退回过两次。
 *
 * 一版是一块实心斜三角，边长 30px。在 333×176 的卷首上还看得过去，
 * 到 125×92 的展馆卡上，四个角一切，矩形就变成了八边形——看图时的原话是
 * 「这照片位是不是在模仿中式园林的窗户？形状不对」。不是窗，是角叶画大了。
 *
 * 二版改成 L 形金条，形状对了，但两条臂是分开画的，肘部有接缝和台阶，
 * 末端齐口切断——反馈圈出肘部说「真的感觉怪怪的，也没能体现中华传统元素」。
 *
 * 三版是如意云头角叶：一条闭合路径画完整件，四个角四张单独生成的图。
 * 这条护栏在真浏览器里量三件事：
 *   ① 边长 ≤ 短边的 1/3 —— 这就是八边形那条线；
 *   ② 正好四层背景，且都是 data URI —— 少了说明有规则把 background 整个覆盖了
 *      （二版的 .mount--sm 正是这么丢的）；
 *   ③ 四个角的图互不相同 —— 四个角是分别生成的，翻转复用会把投影方向也翻过去。
 *      这一条防的是「四张图其实是同一张」，同类 bug 在标志 A/B 对照那轮真的发生过。
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'design')
const PORT = 8000 + Math.floor(Math.random() * 900)
const server = spawn('python3', ['-m', 'http.server', String(PORT)],
                     { cwd: ROOT, stdio: 'ignore' })
const stop = () => { try { server.kill() } catch {} }
process.on('exit', stop); process.on('SIGINT', () => { stop(); process.exit(1) })
await new Promise(r => setTimeout(r, 900))

const BASE = `http://127.0.0.1:${PORT}/demo/v2`
const PAGES = ['home', 'home-cover', 'home-indigo', 'news-detail', 'news-detail-cover']
// 所有"放图片/画的地方"。新增一处图片框，就往这里加一条。
const SLOTS = ['.mount-art', '.art-fig .fig-box > i']
const CORNERS = 4
const MAX_RATIO = 1 / 3    // 边长 / 短边

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const p = await (await b.newContext({ viewport: { width: 375, height: 900 } })).newPage()
let bad = 0, checked = 0
for (const f of PAGES) {
  const res = await p.goto(`${BASE}/${f}.html`, { waitUntil: 'domcontentloaded' }).catch(() => null)
  if (!res || !res.ok()) { console.log(`  – ${f}.html 打不开，跳过`); continue }
  for (const sel of SLOTS) {
    const rows = await p.$$eval(sel, els => els.map(e => {
      const cs = getComputedStyle(e, '::before')
      const r = e.getBoundingClientRect()
      // 只数顶层背景层：data URI 内部也有 url(...)，不能直接数 url(
      const imgs = cs.backgroundImage.match(/url\("data:image\/svg\+xml,[^"]*"\)/g) || []
      return {
        bj: parseFloat(cs.getPropertyValue('--bj')) || 0,
        layers: imgs.length,
        uniq: new Set(imgs).size,
        short: Math.min(r.width, r.height),
        cls: e.className
      }
    }))
    for (const r of rows) {
      checked++
      if (!r.short) continue          // 未渲染，不判
      if (r.layers !== CORNERS) {
        bad++
        console.log(`✗ ${f}.html  ${sel}[${r.cls}] 角叶只有 ${r.layers} 层，应为 ${CORNERS} 层` +
                    `\n    多半是有条更靠后的规则把 background 整个覆盖了`)
      } else if (r.uniq !== CORNERS) {
        bad++
        console.log(`✗ ${f}.html  ${sel}[${r.cls}] 四个角里只有 ${r.uniq} 张不同的图` +
                    `\n    四个角必须分别生成：翻转复用会把投影方向也翻过去`)
      }
      if (r.bj > r.short * MAX_RATIO + 0.01) {
        bad++
        console.log(`✗ ${f}.html  ${sel}[${r.cls}] 角叶边长 ${r.bj}px 超过短边 ${r.short.toFixed(1)}px 的 1/3` +
                    `\n    两个角会在短边上接头，矩形会被切成八边形`)
      }
    }
  }
}
await b.close()
stop()
if (!checked) { console.log('✗ 一个图片框都没量到——预览服务没起？'); process.exit(1) }
if (bad) process.exit(1)
console.log(`✓ 角叶四角齐、互不相同、边长都在短边 1/3 以内（量了 ${checked} 处图片框）`)
