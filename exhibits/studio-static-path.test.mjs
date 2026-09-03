/**
 * 静态托管路径守卫单测
 * 运行：node studio-static-path.test.mjs
 */
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { decodeStaticRel, denyStaticRelReason, isResolvedInsideRoot } from './studio-static-path.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

assert.equal(decodeStaticRel('/'), 'studio.html')
assert.equal(decodeStaticRel('/studio.html'), 'studio.html')
assert.equal(decodeStaticRel('/craft-001/config.json'), 'craft-001/config.json')
assert.throws(() => decodeStaticRel('/%zz'), (e) => e && e.code === 'BAD_URI')

assert.equal(denyStaticRelReason('craft-001/config.json'), '')
assert.equal(denyStaticRelReason('_panoramas/hall.jpg'), '')
assert.equal(denyStaticRelReason('../exhibits-upload/x'), 'traversal')
assert.equal(denyStaticRelReason('..\\exhibits-upload\\x'), 'traversal')
assert.equal(denyStaticRelReason('_server/studio-server.mjs'), 'private')
assert.equal(denyStaticRelReason('_runtime/studio-port.txt'), 'private')
assert.equal(denyStaticRelReason('craft-001/.bak/config.1.json'), 'hidden')
assert.equal(denyStaticRelReason('.studio-instance-id'), 'hidden')

assert.equal(isResolvedInsideRoot(ROOT, path.join(ROOT, 'studio.html')), true)
assert.equal(isResolvedInsideRoot(ROOT, path.join(ROOT, '../exhibits-upload/x')), false)
assert.equal(isResolvedInsideRoot(ROOT, path.join(ROOT, '../../.env')), false)

console.log('[studio-static-path.test] PASS')
