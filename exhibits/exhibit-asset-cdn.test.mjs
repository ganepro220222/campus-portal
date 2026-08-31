import assert from 'node:assert/strict'
import {
  resolveRelativeToExhibit,
  toCdnUrl,
  rewriteAssetValue,
  rewriteExhibitConfig,
  exhibitPublicHref,
  localizeCdnAsset,
} from './exhibit-asset-cdn.mjs'

const CDN = 'https://cdn.yunmanvr.com/exhibits'

assert.equal(resolveRelativeToExhibit('craft-001', 'assets/model.glb'), 'craft-001/assets/model.glb')
assert.equal(resolveRelativeToExhibit('craft-001', '../共享背景/8.jpg'), '共享背景/8.jpg')
assert.equal(
  rewriteAssetValue('assets/model.glb', 'craft-009', CDN),
  'https://cdn.yunmanvr.com/exhibits/craft-009/assets/model.glb',
)
assert.equal(
  rewriteAssetValue('https://cdn.yunmanvr.com/exhibits/craft-001/assets/model.glb', 'craft-001', CDN),
  'https://cdn.yunmanvr.com/exhibits/craft-001/assets/model.glb',
)

const { cfg, changed } = rewriteExhibitConfig({
  assets: { model: 'assets/model.glb', panorama: '../共享背景/8.jpg', poster: 'assets/poster.jpg' },
  audio: [{ src: 'assets/n.mp3' }],
}, 'craft-001', CDN)
assert.equal(changed, 4)
assert.equal(cfg.assets.model, `${CDN}/craft-001/assets/model.glb`)
assert.equal(cfg.assets.panorama, `${CDN}/共享背景/8.jpg`)
assert.equal(cfg.audio[0].src, `${CDN}/craft-001/assets/n.mp3`)

const again = rewriteExhibitConfig(cfg, 'craft-001', CDN)
assert.equal(again.changed, 0)

assert.equal(
  exhibitPublicHref('craft-001', 'assets/poster.jpg'),
  'craft-001/assets/poster.jpg',
)
assert.equal(
  exhibitPublicHref('craft-001', 'https://cdn.yunmanvr.com/exhibits/craft-001/assets/poster.jpg'),
  'https://cdn.yunmanvr.com/exhibits/craft-001/assets/poster.jpg',
)

assert.equal(toCdnUrl(CDN, 'craft-001/assets/model.glb'), `${CDN}/craft-001/assets/model.glb`)

assert.equal(
  localizeCdnAsset(`${CDN}/craft-001/assets/poster.jpg`, 'craft-001'),
  'assets/poster.jpg',
)
assert.equal(
  localizeCdnAsset(`${CDN}/共享背景/8.jpg`, 'craft-001'),
  '../共享背景/8.jpg',
)
assert.equal(
  localizeCdnAsset(`${CDN}/craft-002/assets/model.glb`, 'craft-001'),
  `${CDN}/craft-002/assets/model.glb`,
)
assert.equal(localizeCdnAsset('assets/model.glb', 'craft-001'), 'assets/model.glb')
// 在线编辑器：CDN 地址还原后由 player 拼成同源 /studio/craft-001/assets/model.glb
assert.equal(
  `craft-001/${localizeCdnAsset(`${CDN}/craft-001/assets/model.glb`, 'craft-001')}`,
  'craft-001/assets/model.glb',
)

console.log('exhibit-asset-cdn.test: PASS')
