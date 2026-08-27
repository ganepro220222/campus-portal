#!/usr/bin/env node
const assert = require('node:assert/strict')
const { shouldApplyRecycleListResult } = require('./lib/recycleBinListRequest')

assert.equal(shouldApplyRecycleListResult('news', 'news', 2, 2), true)
assert.equal(shouldApplyRecycleListResult('news', 'activity', 1, 2), false, 'type switched')
assert.equal(shouldApplyRecycleListResult('news', 'news', 1, 2), false, 'stale seq')
console.log('test-recycle-bin-list-request: PASS')
