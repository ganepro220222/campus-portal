/**
 * 重复长句护栏：句号后、冒号后都能检出。
 * 运行：node scripts/duplicate-long-sentences.test.js
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { findDuplicateLongSentences } = require('./duplicate-long-sentences')

const afterPeriod = '如果条件已达成但徽章没有显示，可以退出页面重新进入刷新一次。'
const afterColon = '每日登录：每次 2 分，每天最多 1 次，也就是每天最多 2 分。'

const caseA = [
  '徽章达成条件后自动解锁，不需要手动领取。',
  afterPeriod,
  afterPeriod
].join('')
assert.equal(findDuplicateLongSentences(caseA).length, 1, '紧跟句号的重复句必须检出')
assert.equal(findDuplicateLongSentences(caseA)[0].n, 2)

const caseB = [
  '积分规则一览，每一项都有每天的次数上限，达到上限后当天再做同样的事不再加分：',
  '',
  afterColon,
  afterColon
].join('\n')
assert.equal(findDuplicateLongSentences(caseB).length, 1, '紧跟冒号/段首的重复句必须检出')
assert.equal(findDuplicateLongSentences(caseB)[0].n, 2)
assert.ok(findDuplicateLongSentences(caseB)[0].sentence.includes('每日登录'))

const once = '积分规则一览，每一项都有每天的次数上限，达到上限后当天再做同样的事不再加分：\n\n' + afterColon
assert.equal(findDuplicateLongSentences(once).length, 0)

const srcDir = path.join(__dirname, '..', 'sql', 'knowledge')
for (const name of fs.readdirSync(srcDir).filter((n) => n.endsWith('.md'))) {
  const hits = findDuplicateLongSentences(fs.readFileSync(path.join(srcDir, name), 'utf8'))
  assert.equal(hits.length, 0, `${name} 现网源文件不应有长句重复：${JSON.stringify(hits)}`)
}

const checker = fs.readFileSync(path.join(__dirname, 'check-builtin-knowledge.js'), 'utf8')
assert.match(checker, /findDuplicateLongSentences/, '门禁必须走抽取后再计数，不能再靠缓冲区相等')

console.log('duplicate-long-sentences.test.js OK')
