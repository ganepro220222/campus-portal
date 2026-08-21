/**
 * 内容详情页逻辑依赖检查
 * 运行：node miniapp/utils/contentPageDeps.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const pages = [
  '../packageA/news/detail.js',
  '../packageA/hall/detail.js',
  '../packageB/course/detail.js',
  '../packageA/craft/detail.js'
]

for (const rel of pages) {
  const full = path.join(__dirname, rel)
  const src = fs.readFileSync(full, 'utf8')
  assert.ok(src.includes("require('../../utils/contentPageInit')"), `${rel} must import contentPageInit`)
  assert.ok(src.includes('resolveContentDetailOnLoad'), `${rel} must resolve entry id`)
  assert.ok(src.includes('buildContentDetailInitialFailurePatch'), `${rel} must handle load failure`)
  assert.ok(!src.includes('.catch(() => null)'), `${rel} must not swallow detail errors`)
}

console.log('[contentPageDeps.test] PASS')
