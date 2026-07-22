#!/usr/bin/env node
/** 校验 HTML 页面 module import 的相对静态资源均存在 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

const PAGES = ['studio.html', 'player.html', 'player.view.html']

function resolveImport(fromDir, spec) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null
  let base = path.resolve(fromDir, spec)
  if (fs.existsSync(base)) return base
  for (const ext of ['.mjs', '.js']) {
    if (fs.existsSync(base + ext)) return base + ext
  }
  return base
}

function importsFromHtml(html) {
  const out = []
  for (const m of html.matchAll(/import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g)) out.push(m[1])
  return out
}

let failed = 0
for (const rel of PAGES) {
  const full = path.join(ROOT, rel)
  if (!fs.existsSync(full)) {
    console.error(`missing page: ${rel}`)
    failed++
    continue
  }
  const html = fs.readFileSync(full, 'utf8')
  for (const spec of importsFromHtml(html)) {
    if (!spec.startsWith('./') && !spec.startsWith('../')) continue
    const target = resolveImport(path.dirname(full), spec)
    if (!target || !fs.existsSync(target)) {
      console.error(`${rel}: import '${spec}' → not found (${target || spec})`)
      failed++
    }
  }
}

if (failed) {
  console.error(`check-static-deps: ${failed} missing`)
  process.exit(1)
}
console.log('check-static-deps OK')
