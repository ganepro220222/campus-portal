#!/usr/bin/env node
/**
 * 高频小操作触控热区检查 —— 钉住 §25/§27 扩到 88rpx（375pt 宽 ≈ 44pt）的三处。
 *
 * 只查写死在 wxss 里的盒子/伪元素，不扫全站 bindtap（那类靠人工 review）。
 * 视觉图标尺寸可以不变，热区靠盒子留白或 ::after 外扩。
 *
 * 用法：node scripts/check-touch-targets.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const MIN_RPX = 88

/** @param {string} decl @param {string} prop */
function rpx(decl, prop) {
  const m = decl.match(new RegExp(prop + '\\s*:\\s*(-?\\d+)rpx'))
  return m ? Math.abs(Number(m[1])) : null
}

/** @param {string} rel @param {string} selector */
function ruleBlock(rel, selector) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8')
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = src.match(new RegExp(esc + '\\s*\\{([^}]*)\\}', 's'))
  if (!m) throw new Error(`${rel} 找不到 ${selector}`)
  return m[1]
}

function main() {
  const errs = []

  const eye = ruleBlock('miniapp/pages/login/index.wxss', '.field-eye')
  const eyeW = rpx(eye, 'width')
  const eyeH = rpx(eye, 'height')
  if (eyeW < MIN_RPX || eyeH < MIN_RPX) {
    errs.push(`登录密码显隐 .field-eye 热区 ${eyeW}×${eyeH}rpx，低于 ${MIN_RPX}rpx（44pt）`)
  }

  const sclear = ruleBlock('miniapp/packageC/search/index.wxss', '.sclear')
  const scW = rpx(sclear, 'width')
  const scH = rpx(sclear, 'height')
  if (scW < MIN_RPX || scH < MIN_RPX) {
    errs.push(`搜索清空 .sclear 热区 ${scW}×${scH}rpx，低于 ${MIN_RPX}rpx（44pt）`)
  }

  const del = ruleBlock('miniapp/packageC/feedback/index.wxss', '.fb-img-del')
  const after = ruleBlock('miniapp/packageC/feedback/index.wxss', '.fb-img-del::after')
  const base = rpx(del, 'width')
  const inset = rpx(after, 'left')
  if (base == null || inset == null) {
    errs.push('反馈删除 .fb-img-del / ::after 解析失败')
  } else {
    const hit = base + inset * 2
    if (hit < MIN_RPX) {
      errs.push(`反馈删除 .fb-img-del 热区 ${hit}rpx（${base}+${inset}×2），低于 ${MIN_RPX}rpx`)
    }
  }

  const tabBar = fs.readFileSync(path.join(root, 'miniapp/app.json'), 'utf8')
  if (/\"color\"\s*:\s*\"#8A93B2\"/i.test(tabBar)) {
    errs.push('app.json tabBar.color 仍为 #8A93B2，应与 --muted #67708C 同步')
  }

  if (errs.length) {
    console.error('check-touch-targets 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  console.log(`check-touch-targets OK（密码显隐 / 搜索清空 / 反馈删除均 ≥${MIN_RPX}rpx，tabBar 色已同步）`)
}

main()
