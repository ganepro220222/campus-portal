#!/usr/bin/env node
/**
 * 跑 miniapp/utils 下的所有 *.test.js。
 *
 * 这些用例本来是各写各的、只能手动 `node miniapp/utils/xxx.test.js` 单跑，
 * 没有任何脚本会去执行它们——写了等于没写。这里统一发现并执行，接进 preflight:local。
 *
 * 约定：每个用例文件自己 assert，失败就非零退出（现有文件都是这个写法）。
 *
 * 用法：node scripts/test-miniapp-utils.js
 */
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const root = path.join(__dirname, '..')
const utilsDir = path.join(root, 'miniapp/utils')

const files = fs.readdirSync(utilsDir)
  .filter(n => n.endsWith('.test.js'))
  .sort()

if (!files.length) {
  console.error('test-miniapp-utils: miniapp/utils 下没有找到 *.test.js —— 是不是目录挪了？')
  process.exit(1)
}

let failed = 0
for (const name of files) {
  const full = path.join(utilsDir, name)
  const r = spawnSync(process.execPath, [full], { encoding: 'utf8' })
  if (r.status === 0) {
    console.log(`  ok  miniapp/utils/${name}`)
  } else {
    failed++
    console.error(`  FAIL miniapp/utils/${name}`)
    const out = ((r.stdout || '') + (r.stderr || '')).trimEnd()
    if (out) console.error(out.split('\n').map(l => '       ' + l).join('\n'))
  }
}

if (failed) {
  console.error(`test-miniapp-utils: ${failed}/${files.length} 个用例文件失败`)
  process.exit(1)
}
console.log(`test-miniapp-utils OK（${files.length} 个用例文件）`)
