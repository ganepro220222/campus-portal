#!/usr/bin/env node
const assert = require('node:assert/strict')
const {
  shouldApplyDeleteImpactResult,
  deleteImpactMatchesPending,
} = require('./lib/deleteImpactRequest')

assert.equal(
  shouldApplyDeleteImpactResult({
    requestedId: 1,
    requestedType: 'news',
    currentId: 1,
    currentType: 'news',
    seq: 1,
    latestSeq: 2,
    dialogVisible: true,
  }),
  false,
  'stale seq',
)

assert.equal(
  shouldApplyDeleteImpactResult({
    requestedId: 1,
    requestedType: 'news',
    currentId: 2,
    currentType: 'news',
    seq: 2,
    latestSeq: 2,
    dialogVisible: true,
  }),
  false,
  'pending changed',
)

assert.equal(
  shouldApplyDeleteImpactResult({
    requestedId: 1,
    requestedType: 'news',
    currentId: 1,
    currentType: 'news',
    seq: 2,
    latestSeq: 2,
    dialogVisible: false,
  }),
  false,
  'dialog closed',
)

assert.equal(
  shouldApplyDeleteImpactResult({
    requestedId: 1,
    currentId: 1,
    seq: 1,
    latestSeq: 1,
    dialogVisible: true,
  }),
  true,
  'member id-only',
)

assert.equal(deleteImpactMatchesPending({ id: 2, type: 'activity' }, 2, 'activity'), true)
assert.equal(deleteImpactMatchesPending({ id: 1, type: 'news' }, 2, 'activity'), false)

console.log('test-delete-impact-request: PASS')
