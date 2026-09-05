import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  collectStagingEditorRelPaths,
  collectStagingExhibitsCheckoutPaths,
} from './staging-editor-paths.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

const live = collectStagingEditorRelPaths()
assert.ok(live.includes('shading-risk.mjs'), 'live collect must include shading-risk.mjs')
assert.ok(collectStagingExhibitsCheckoutPaths().includes('exhibits/shading-risk.mjs'))

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-collect-'))
try {
  fs.writeFileSync(
    path.join(tmp, 'player.html'),
    `<script type="module">\nimport { x } from './brand-new-mod.mjs'\n</script>\n`,
  )
  const copyList = collectStagingEditorRelPaths(tmp)
  assert.ok(!copyList.includes('brand-new-mod.mjs'), 'copy list skips files not on disk')
  const checkout = collectStagingExhibitsCheckoutPaths(tmp)
  assert.ok(
    checkout.includes('exhibits/brand-new-mod.mjs'),
    'checkout list must keep player.html imports that git still has to fetch',
  )
  assert.ok(!checkout.includes('exhibits/pano-check.py'), 'ghost EXTRA files must not enter checkout list')
} finally {
  fs.rmSync(tmp, { recursive: true, force: true })
}

assert.ok(!live.some(p => /^craft-/.test(p)), 'must not include exhibit content')
assert.ok(!collectStagingExhibitsCheckoutPaths().includes('exhibits/pano-check.py'))
console.log('staging-editor-paths: PASS')
