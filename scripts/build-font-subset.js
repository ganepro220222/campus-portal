#!/usr/bin/env node
/**
 * 由 design/fonts/shuyuan-serif-400.woff2 生成小程序可用的 @font-face WXSS。
 *
 * 为什么是「base64 内嵌」而不是 wx.loadFontFace：
 *   loadFontFace 只收网络地址，要配 downloadFile 合法域名，还必须返回
 *   Access-Control-Allow-Origin: *（设成 servicewechat.com 时 iOS 能过、安卓挂），
 *   荣耀 / vivo 等机型对字体 CORS 的校验更严，做不到「所有设备都正常显示」。
 *   内嵌进代码包则不走网络、不需要白名单、没有机型分裂。
 *
 * 字集怎么来的：见 design/fonts/subset-charset.txt
 *   GB2312 一级 3755 字 + 项目全语料出现过的汉字 + 书法/印章会用到的繁体雅字 + 标点，
 *   共 4001 字符。只做一个字重（400）：中文标题靠字号和留白建立层级，不靠加粗。
 *
 * 用法：node scripts/build-font-subset.js [--check]
 *   --check 只校验产物与源文件一致，不写盘（护栏用）。
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SRC = path.join(ROOT, 'design/fonts/shuyuan-serif-400.woff2')
const OUT = path.join(ROOT, 'miniapp/styles/font-shuyuan-song.wxss')
const FAMILY = 'ShuyuanSong'

function render(base64) {
  return `/* 本文件由 scripts/build-font-subset.js 生成，请勿手改。
   源字体：思源宋体 Noto Serif SC（SIL OFL 1.1，可商用、可嵌入、可子集化）
   子集：design/fonts/subset-charset.txt（4001 字符，单字重 400）
   改字集或换字体后重新执行 node scripts/build-font-subset.js */
@font-face {
  font-family: "${FAMILY}";
  font-weight: 400;
  font-style: normal;
  src: url("data:font/woff2;charset=utf-8;base64,${base64}") format("woff2");
}
`
}

function main() {
  const check = process.argv.includes('--check')
  if (!fs.existsSync(SRC)) {
    console.error(`✗ 找不到源字体 ${path.relative(ROOT, SRC)}`)
    process.exit(1)
  }
  const base64 = fs.readFileSync(SRC).toString('base64')
  const text = render(base64)

  if (check) {
    if (!fs.existsSync(OUT)) {
      console.error(`✗ ${path.relative(ROOT, OUT)} 不存在，请先执行 node scripts/build-font-subset.js`)
      process.exit(1)
    }
    if (fs.readFileSync(OUT, 'utf8') !== text) {
      console.error(`✗ ${path.relative(ROOT, OUT)} 与源字体不一致，请重新执行 node scripts/build-font-subset.js`)
      process.exit(1)
    }
    console.log(`✓ 字体 WXSS 与源文件一致（${(base64.length / 1024).toFixed(0)} KB base64）`)
    return
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, text)
  console.log(`✓ 已生成 ${path.relative(ROOT, OUT)}`)
  console.log(`  woff2 ${(fs.statSync(SRC).size / 1024).toFixed(0)} KB → base64 ${(base64.length / 1024).toFixed(0)} KB`)
}

main()
