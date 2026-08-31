#!/usr/bin/env node
// Rewrite relative exhibit asset paths to CDN absolute URLs.
// Usage on ECS:
//   node scripts/rewrite-exhibit-asset-cdn.mjs
//   node scripts/rewrite-exhibit-asset-cdn.mjs --dry-run
//   node scripts/rewrite-exhibit-asset-cdn.mjs --root /opt/shuyuan/exhibits --pack /tmp/exhibit-cdn-configs.tgz
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { rewriteExhibitConfig } from '../exhibits/exhibit-asset-cdn.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(name)
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('-') ? args[i + 1] : fallback
}

const dryRun = args.includes('--dry-run')
const root = path.resolve(flag('--root', path.join(here, '..', 'exhibits')))
const cdnBase = (flag('--cdn', 'https://cdn.yunmanvr.com/exhibits')).replace(/\/+$/, '')
const pack = flag('--pack', '')

const dirs = fs.readdirSync(root, { withFileTypes: true })
  .filter(d => d.isDirectory() && /^craft-\d+/.test(d.name))
  .map(d => d.name)
  .sort()

if (!dirs.length) {
  console.error('no craft-* under ' + root)
  process.exit(1)
}

let files = 0
let fields = 0
for (const dir of dirs) {
  const cfgPath = path.join(root, dir, 'config.json')
  if (!fs.existsSync(cfgPath)) continue
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  const { changed } = rewriteExhibitConfig(cfg, dir, cdnBase)
  if (!changed) continue
  files++
  fields += changed
  if (!dryRun) {
    fs.writeFileSync(cfgPath, `${JSON.stringify(cfg, null, 2)}\n`, 'utf8')
  }
  console.log((dryRun ? 'DRY ' : '') + dir + '  ' + changed)
}

console.log((dryRun ? 'would update ' : 'updated ') + files + ' configs, ' + fields + ' fields -> ' + cdnBase)

if (pack && !dryRun) {
  const listed = dirs.filter(d => fs.existsSync(path.join(root, d, 'config.json')))
  const tar = spawnSync('tar', ['-czf', pack, '-C', root, ...listed.map(d => `${d}/config.json`)], { stdio: 'inherit' })
  if (tar.status !== 0) process.exit(tar.status || 1)
  console.log('partner config pack: ' + pack)
}
