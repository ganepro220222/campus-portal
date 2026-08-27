#!/usr/bin/env node
const assert = require('node:assert/strict')
const { normalizeListPage } = require('./lib/listPageNormalize')

assert.equal(normalizeListPage(3, 40, 20), 2, 'page 3 empty -> page 2')
assert.equal(normalizeListPage(1, 0, 20), 1)
assert.equal(normalizeListPage(2, 25, 20), 2)
assert.equal(normalizeListPage(5, 25, 20), 2)
console.log('test-list-page-normalize: PASS')
