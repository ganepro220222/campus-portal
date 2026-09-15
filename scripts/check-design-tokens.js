#!/usr/bin/env node
/**
 * 木色是整个小程序的主体色，必须只有一个出处。
 *
 * 前两轮翻过车：改了 --wood 之类的变量，屏幕上却几乎没变化——因为首图、匾额、
 * 展馆封面、登录页那些**大面积**的棕色全是写死的十六进制，根本没走变量。
 * 一次审计出 43 处。靠人眼是查不出来的。
 *
 * 所以这条护栏很简单：token 定义区之外，不许再出现暖棕/纸色系的写死色值。
 * 中性灰、朱砂、金线这些另有去处，不在此列（见 ALLOW）。
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const TARGETS = ['design/demo/v2/shuyuan.css']

// 这些不属于木/纸色系，或是有意为之的一次性色，放行
const ALLOW = new Set([
  '#c9c2b2', // 稿纸外的画板底，只出现在设计稿里，不进小程序
  '#4a4335', // 同上：稿件标注文字
  '#9a3028', '#7b221c', '#f5e7ce', // 登录主按钮：朱砂系，走 --zhu 一族
  '#dccdae', // 校徽圆牌最外圈的一档，色阶里没有对应值
  '#231708', // 祥云近层的压暗色
  '#43301f', '#1b2e3f', '#3a2a19', // 生成器里的檐脊色，由 _ornaments.py 管
])

function warmish(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mx = Math.max(r, g, b)
  const mn = Math.min(r, g, b)
  if (mx === mn) return false          // 纯灰
  if (mx !== r) return false           // 红不是最大分量，不是暖棕
  if (g < b) return false              // 偏品红，不是木色
  return r - b > 20                    // 红蓝差够大才算暖棕/纸色系
}

const problems = []
for (const rel of TARGETS) {
  const file = path.join(ROOT, rel)
  if (!fs.existsSync(file)) {
    problems.push(`✗ 找不到 ${rel}`)
    continue
  }
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/^\s*--[\w-]+:\s*#/.test(line)) return          // token 定义本身
    if (/^\s*(\/\*|\*)/.test(line)) return              // 注释
    for (const m of line.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      const hex = m[0].toLowerCase()
      if (ALLOW.has(hex) || !warmish(hex)) continue
      problems.push(`✗ ${rel}:${i + 1} 写死了木/纸色 ${hex}\n    ${line.trim().slice(0, 88)}`)
    }
  })
}

if (problems.length) {
  console.error(`设计令牌检查未通过，${problems.length} 处：\n`)
  console.error(problems.join('\n'))
  console.error('\n  修法：改用 var(--wood-XX) / var(--paper-X)。')
  console.error('  确实不属于木纸色系的，加进 scripts/check-design-tokens.js 的 ALLOW 并写明理由。')
  process.exit(1)
}
console.log('✓ 木色与纸色全部走令牌，没有写死的色值')
