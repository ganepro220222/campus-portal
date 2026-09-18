#!/usr/bin/env node
/**
 * 把一张外来的小篆字形 SVG 归一成 design/brand/seal-script/ 的约定。
 *
 * 为什么要归一：jade_medallion() 是按 **viewBox** 算缩放的（k = gsz / max(vw,vh)），
 * 它没有 SVG 引擎，量不了墨迹。所以字在框里占多大、偏不偏，全由字形文件自己决定——
 * 同一个 gsz，一张占框 76% 的字和一张占框 45% 的字，出来会差一大截。
 * 约定因此定死三条，和目录里已有的 闻.svg 对齐：
 *
 *   ① viewBox 统一 0 0 1000 1000；
 *   ② 墨迹**居中**（中心偏移 0,0）；
 *   ③ 墨迹**最长边 = 760**（占框 76%）。
 *
 * 这样 gsz 才是一个能调的旋钮：改它，每个字都同比例变大变小。
 *
 * 另外还要洗两样东西：
 *   · 字库导出常带**水印**——这张 問 的右下角就有两条 #fcfbfa 的白字。
 *     白底上看不见，扣到青玉牌面上就会显出来。
 *   · 导出还会把颜色**烤死**在 <g fill="#010103"> 上。玉牌是拿
 *     <g fill="#FFFFFF">（下沿高光）和 <g fill="#3E5A55">（实字）套在字身外面的，
 *     字身自己带 fill 就会把这两层都盖掉，阴刻的立体感直接没了。
 *     所以字身里一律不许有 fill，靠继承。
 *
 * 用法：node scripts/normalize-seal-glyph.mjs <源文件> <字>
 *   例：node scripts/normalize-seal-glyph.mjs /tmp/問.svg 问
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BOX = 1000        // 归一后的 viewBox 边长
const INK = 760         // 归一后墨迹最长边

const [src, ch] = process.argv.slice(2)
if (!src || !ch) {
  console.error('用法：node scripts/normalize-seal-glyph.mjs <源文件> <字>')
  process.exit(2)
}

/** 抽出 <svg> 里面那一段，顺手把水印和烤死的颜色洗掉 */
function cleanBody(raw) {
  let body = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim()
  // ① 水印：字库导出爱在角上落一行浅色小字，通常是接近纸白的浅色
  const before = body
  body = body.replace(/<path\b[^>]*\bfill="(#[fF][cC-fF][a-fA-F0-9]{4})"[^>]*\/>/g, '')
  const washed = (before.match(/<path/g) || []).length - (body.match(/<path/g) || []).length
  // ② 烤死的颜色：字身不许带 fill，玉牌要靠外层 <g fill> 上色
  const fills = [...body.matchAll(/\bfill="([^"]*)"/g)].map(m => m[1])
  body = body.replace(/\s*\bfill="[^"]*"/g, '')
  // 空的 <g> 壳子留着没用
  body = body.replace(/<g\s*>([\s\S]*?)<\/g>/g, '$1').trim()
  return { body, washed, fills }
}

async function inkBox(body, viewBox) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  const p = await (await b.newContext()).newPage()
  await p.setContent('<div></div>')
  const r = await p.evaluate(([vb, inner]) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    el.setAttribute('viewBox', vb)
    el.innerHTML = inner
    document.body.appendChild(el)
    const bb = el.getBBox()
    el.remove()
    return { x: bb.x, y: bb.y, w: bb.width, h: bb.height }
  }, [viewBox, body])
  await b.close()
  return r
}

async function main() {
  const raw = fs.readFileSync(src, 'utf8')
  const vbm = raw.match(/viewBox="([^"]*)"/)
  if (!vbm) throw new Error('源文件没有 viewBox，量不了')
  const { body, washed, fills } = cleanBody(raw)
  if (!body) throw new Error('洗完之后字身是空的')

  const bb = await inkBox(body, vbm[1])
  if (!(bb.w > 0 && bb.h > 0)) throw new Error('量不到墨迹，字身可能不是图形')

  // 居中 + 把最长边缩到 INK
  const s = INK / Math.max(bb.w, bb.h)
  const tx = BOX / 2 - (bb.x + bb.w / 2) * s
  const ty = BOX / 2 - (bb.y + bb.h / 2) * s
  const f = n => +n.toFixed(4)
  const out =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX} ${BOX}" fill="currentColor">` +
    `<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(s)})">${body}</g></svg>\n`

  const dst = path.join(ROOT, 'design/brand/seal-script', `${ch}.svg`)
  fs.writeFileSync(dst, out)

  // 复核：拿写出去的文件重新量一遍，三条约定逐条兑现
  const back = fs.readFileSync(dst, 'utf8')
  const bb2 = await inkBox(
    back.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), `0 0 ${BOX} ${BOX}`)
  const off = [bb2.x + bb2.w / 2 - BOX / 2, bb2.y + bb2.h / 2 - BOX / 2]
  const longest = Math.max(bb2.w, bb2.h)
  const bad = []
  if (Math.abs(off[0]) > 0.5 || Math.abs(off[1]) > 0.5) bad.push(`没居中：偏 ${off.map(n => n.toFixed(2))}`)
  if (Math.abs(longest - INK) > 0.5) bad.push(`最长边 ${longest.toFixed(1)}，该是 ${INK}`)
  if (/\bfill=/.test(back.replace(/^<svg[^>]*>/, ''))) bad.push('字身里还留着 fill')
  if (bad.length) throw new Error('归一之后自检没过：\n  ' + bad.join('\n  '))

  console.log(`✓ ${ch} → ${path.relative(ROOT, dst)}`)
  console.log(`  洗掉水印 ${washed} 条；源文件烤死的颜色 ${[...new Set(fills)].join('、') || '无'} 已去掉`)
  console.log(`  墨迹 ${bb.w.toFixed(1)}×${bb.h.toFixed(1)}（源框 ${vbm[1]}）→ ` +
              `${bb2.w.toFixed(1)}×${bb2.h.toFixed(1)}（${BOX} 框，最长边 ${INK}，居中）`)
}

await main()
