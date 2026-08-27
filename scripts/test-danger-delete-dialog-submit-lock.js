#!/usr/bin/env node
const assert = require('node:assert/strict')
const { shouldAllowDangerDeleteDialogClose } = require('./lib/dangerDeleteDialogSubmitLock')

assert.equal(shouldAllowDangerDeleteDialogClose(false), true, 'idle may close')
assert.equal(shouldAllowDangerDeleteDialogClose(true), false, 'submitting must stay open')

console.log('test-danger-delete-dialog-submit-lock: PASS')
