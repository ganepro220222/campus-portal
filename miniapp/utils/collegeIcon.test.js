/**
 * 关联小程序图标展示字段。
 * 运行：node miniapp/utils/collegeIcon.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  normalizeCollegeIconFit,
  normalizeCollegeIconShape,
  decorateCollegeApp,
  decorateCollegeApps,
  decorateHomeCollegeLists
} = require('./collegeIcon')

assert.strictEqual(normalizeCollegeIconFit(null), 'fit')
assert.strictEqual(normalizeCollegeIconFit(''), 'fit')
assert.strictEqual(normalizeCollegeIconFit('FIT'), 'fit')
assert.strictEqual(normalizeCollegeIconFit('fill'), 'fill')
assert.strictEqual(normalizeCollegeIconFit(' FILL '), 'fill')

assert.strictEqual(normalizeCollegeIconShape(undefined), 'square')
assert.strictEqual(normalizeCollegeIconShape('square'), 'square')
assert.strictEqual(normalizeCollegeIconShape('circle'), 'circle')
assert.strictEqual(normalizeCollegeIconShape(' CIRCLE '), 'circle')

const legacy = decorateCollegeApp({ id: 1, name: '通途星' })
assert.strictEqual(legacy.iconFitMode, 'fit')
assert.strictEqual(legacy.iconShape, 'square')
assert.strictEqual(legacy.iconImageMode, 'aspectFit')
assert.strictEqual(legacy.iconCircle, false)

const circle = decorateCollegeApp({
  id: 2,
  iconUrl: 'https://example.com/icon.png',
  iconFitMode: 'fill',
  iconShape: 'circle'
})
assert.strictEqual(circle.iconImageMode, 'aspectFill')
assert.strictEqual(circle.iconCircle, true)

assert.deepStrictEqual(decorateCollegeApps(null), [])
assert.strictEqual(decorateCollegeApps([legacy, circle]).length, 2)

const home = decorateHomeCollegeLists({
  banners: [{ id: 9 }],
  collegeList: [{ id: 1 }],
  collegeHome: [{ id: 1, iconShape: 'circle' }]
})
assert.deepStrictEqual(home.banners, [{ id: 9 }])
assert.strictEqual(home.collegeList[0].iconImageMode, 'aspectFit')
assert.strictEqual(home.collegeHome[0].iconCircle, true)

const indexJs = fs.readFileSync(path.join(__dirname, '../pages/index/index.js'), 'utf8')
assert.match(indexJs, /decorateCollegeApps/)
assert.match(indexJs, /decorateHomeCollegeLists/)

const listJs = fs.readFileSync(path.join(__dirname, '../packageC/college/list.js'), 'utf8')
assert.match(listJs, /decorateCollegeApps/)

for (const rel of ['../pages/index/index.wxml', '../packageC/college/list.wxml']) {
  const wxml = fs.readFileSync(path.join(__dirname, rel), 'utf8')
  assert.match(wxml, /iconImageMode/, `${rel} 须按后台设置渲染图标`)
  assert.match(wxml, /iconCircle/, `${rel} 须能切圆形`)
}

const wxss = fs.readFileSync(path.join(__dirname, '../app.wxss'), 'utf8')
assert.match(wxss, /\.app-icon--circle/)

console.log('[collegeIcon.test] PASS')
