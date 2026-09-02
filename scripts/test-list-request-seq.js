#!/usr/bin/env node
const assert = require('node:assert/strict')
const { shouldApplyListResult } = require('./lib/listRequestSeq')

assert.equal(shouldApplyListResult(2, 2), true)
assert.equal(shouldApplyListResult(1, 2), false, 'stale seq')
assert.equal(shouldApplyListResult(3, 2), false, 'future seq')
console.log('test-list-request-seq: PASS')
