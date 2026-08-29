#!/usr/bin/env node
const assert = require('assert')
const { resolveEndedReport, shouldReportByInterval } = require('./coursePlayerProgress')

// ended 应使用缓存 duration，不能发 0/0
{
  const r = resolveEndedReport({ detailDuration: 0, cachedDuration: 600, cachedPosition: 580 })
  assert.strictEqual(r.total, 600)
  assert.strictEqual(r.position, 600)
}

{
  const r = resolveEndedReport({ detailDuration: 90, cachedDuration: 600, cachedPosition: 80 })
  assert.strictEqual(r.total, 90)
  assert.strictEqual(r.position, 90)
}

{
  const r = resolveEndedReport({ detailDuration: 0, cachedDuration: 0, cachedPosition: 45 })
  assert.strictEqual(r.total, 0)
  assert.strictEqual(r.position, 45)
}

// 周期上报
assert.strictEqual(shouldReportByInterval(20, 0), true)
assert.strictEqual(shouldReportByInterval(19, 0), false)
assert.strictEqual(shouldReportByInterval(40, 20), true)

console.log('coursePlayerProgress.test: PASS')
