/**
 * 文创详情映射单测（对照验收 §2.5 3D 降级逻辑）
 * 运行：node miniapp/utils/content.test.js
 */
const assert = require('assert')
const { hasCraftModel3d, mergeCraftDetail } = require('./content')

assert.strictEqual(hasCraftModel3d('model3d', 'https://cdn/a.glb'), true)
assert.strictEqual(hasCraftModel3d('model3d', ''), false)
assert.strictEqual(hasCraftModel3d('multi_image', 'https://cdn/a.glb'), false)

const merged = mergeCraftDetail({
  id: 3,
  previewType: 'model3d',
  model3dUrl: 'https://cdn.example.com/mask.glb',
  introZh: '中文',
  introEn: 'EN'
}, {})

assert.strictEqual(merged.canUse3d, true)
assert.strictEqual(merged.previewType, 'model3d')

const fallback = mergeCraftDetail({
  id: 3,
  previewType: 'model3d',
  model3dUrl: ''
}, { previewType: 'multi_image', images: [{ imageUrl: 'x' }] })

assert.strictEqual(fallback.canUse3d, false)

console.log('[content.test] PASS')
