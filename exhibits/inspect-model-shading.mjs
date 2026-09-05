#!/usr/bin/env node
// Scan craft-*/config.json + model.glb for iOS black-body risk facts.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseGlbJson, inspectExhibit } from './shading-risk.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const target = path.resolve(process.argv[2] || ROOT)

function listCrafts(root) {
  return fs.readdirSync(root)
    .filter((n) => n.startsWith('craft-') && fs.statSync(path.join(root, n)).isDirectory())
    .sort()
}

function inspectOne(dir) {
  const name = path.basename(dir)
  const cfgPath = path.join(dir, 'config.json')
  if (!fs.existsSync(cfgPath)) return { name, error: 'no config.json' }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  const modelRel = cfg.assets?.model
  if (!modelRel || /^https?:/i.test(modelRel)) {
    return { name, error: 'model is remote or missing; skip binary inspect', configMetalness: cfg.materials?.global?.metalness }
  }
  const modelPath = path.resolve(dir, modelRel)
  if (!fs.existsSync(modelPath)) return { name, error: `missing ${modelRel}` }
  const { json, bin } = parseGlbJson(fs.readFileSync(modelPath))
  return { name, ...inspectExhibit(cfg, json, bin) }
}

const crafts = listCrafts(target)
if (!crafts.length) {
  console.log(`no craft-* under ${target}`)
  process.exit(0)
}
for (const name of crafts) {
  const r = inspectOne(path.join(target, name))
  console.log(`\n=== ${r.name} ===`)
  if (r.error) {
    console.log('  ', r.error)
    continue
  }
  console.log(`  runtime metalness ${r.materialMetalnessMax}  config ${r.configHasMetal ? r.configMetalness : 'unset'}  GLB authored max ${r.authoredMetalnessMax}`)
  console.log(`  albedo max edge ${r.maxAlbedoEdge}  ktx2 ${r.usesKtx2}  draco ${r.usesDraco}`)
  for (const m of r.materials) {
    console.log(`  mat ${m.name || '(unnamed)'} metal=${m.metallicFactor} rough=${m.roughnessFactor} map=${m.hasBaseColorTexture ? `${m.imageWidth}x${m.imageHeight} ${m.imageKind || m.imageMime}` : 'none'}`)
  }
  if (!r.risks.length) console.log('  risks: none (file facts only; runtime IBL still needs phone A/B)')
  else r.risks.forEach((x) => console.log(`  RISK ${x.severity} ${x.id}: ${x.text}`))
}
