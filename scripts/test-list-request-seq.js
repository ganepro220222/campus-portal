#!/usr/bin/env node
const assert = require('node:assert/strict')
const { shouldApplyCandidateResult, shouldApplyListResult } = require('./lib/listRequestSeq')

assert.equal(shouldApplyListResult(2, 2), true)
assert.equal(shouldApplyListResult(1, 2), false, 'stale seq')
assert.equal(shouldApplyListResult(3, 2), false, 'future seq')

assert.equal(shouldApplyCandidateResult(2, 2, true, 'news', 'news'), true)
assert.equal(shouldApplyCandidateResult(1, 2, true, 'news', 'news'), false, '过期请求不得写入')
assert.equal(shouldApplyCandidateResult(2, 2, false, 'news', 'news'), false, '弹窗已关不得写入')
assert.equal(shouldApplyCandidateResult(2, 2, true, 'news', 'hall'), false, '已切板块不得写入')
console.log('test-list-request-seq: PASS')
