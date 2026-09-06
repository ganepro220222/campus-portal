/**
 * 课程卡片标签：分类与字幕并排，不再互相替换
 * 运行：node miniapp/utils/decorate.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { decorateCourses, decorateCourseCards } = require('./decorate')

const fromApi = decorateCourseCards([{
  id: 1,
  name: '有字幕的课',
  categoryName: '通识必修',
  cat: '通识必修',
  hasSubtitle: true,
  tags: ['通识必修', '字幕']
}])[0]
assert.deepStrictEqual(fromApi.tags, ['通识必修', '字幕'])
assert.strictEqual(fromApi.tag, '通识必修')
assert.strictEqual(fromApi.categoryName, '通识必修')
assert.strictEqual(fromApi.hasSubtitle, true)
assert.strictEqual(fromApi.tagGold, false)

const noSubtitle = decorateCourseCards([{
  id: 2,
  name: '无字幕',
  categoryName: '专题学习'
}])[0]
assert.deepStrictEqual(noSubtitle.tags, ['专题学习'])
assert.strictEqual(noSubtitle.hasSubtitle, false)

const oldMock = decorateCourseCards([{
  id: 3,
  name: '旧 mock',
  cat: '职业素养',
  tag: '字幕',
  tagGold: true
}])[0]
assert.deepStrictEqual(oldMock.tags, ['职业素养', '字幕'])
assert.strictEqual(oldMock.tag, '职业素养')
assert.strictEqual(oldMock.tagGold, false)

const homeLegacy = decorateCourses([{
  id: 4,
  name: '首页旧 mock',
  categoryName: '字幕',
  tagGold: true
}])[0]
assert.deepStrictEqual(homeLegacy.tags, ['精品课程', '字幕'])
assert.strictEqual(homeLegacy.categoryName, '精品课程')

const homeApi = decorateCourses([{
  id: 5,
  name: '首页接口',
  categoryName: '通识必修',
  lessonCount: 8,
  audience: '全校学生'
}])[0]
assert.deepStrictEqual(homeApi.tags, ['通识必修'])
assert.strictEqual(homeApi.hasSubtitle, false)

const homeApiReady = decorateCourses([{
  id: 6,
  name: '首页有字幕',
  categoryName: '通识必修',
  hasSubtitle: true,
  tags: ['通识必修', '字幕'],
  lessonCount: 8
}])[0]
assert.deepStrictEqual(homeApiReady.tags, ['通识必修', '字幕'])

const courseWxml = fs.readFileSync(path.join(__dirname, '../pages/course/index.wxml'), 'utf8')
assert.match(courseWxml, /wx:for="\{\{item\.tags\}\}"/)
assert.match(courseWxml, /wx:for-item="tagName"/)
assert.doesNotMatch(courseWxml, /item\.tagGold \? 'gold'/)

const homeWxml = fs.readFileSync(path.join(__dirname, '../pages/index/index.wxml'), 'utf8')
assert.match(homeWxml, /wx:for="\{\{item\.tags\}\}"/)
assert.match(homeWxml, /wx:for-item="tagName"/)
assert.doesNotMatch(homeWxml, /item\.tag \|\| item\.categoryName/)

console.log('[decorate.test] PASS')
