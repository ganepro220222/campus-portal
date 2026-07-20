import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, 'player.view.html')
const SRC = path.join(ROOT, 'player.html')

export function buildViewerSrc(playerHtml = fs.readFileSync(SRC, 'utf8')) {
  return playerHtml
    .replace(/[ \t]*\/\* EDITOR-CSS-START[\s\S]*?\/\* EDITOR-CSS-END \*\/\n?/, '')
    .replace(/[ \t]*<!-- EDITOR-HTML-START[\s\S]*?<!-- EDITOR-HTML-END -->\n?/, '')
    .replace(/[ \t]*\/\* EDITOR-JS-START[\s\S]*?\/\* EDITOR-JS-END \*\/\n?/, '')
    .replace(/[ \t]*\/\* TEST-HOOKS-START[\s\S]*?\/\* TEST-HOOKS-END \*\/\n?/, '')
    .replace(/const editMode = params\.get\('mode'\) === 'edit'/, 'const editMode = false /* viewer-only */')
    .replace(/if \(editMode && typeof buildEditor === 'function'\) buildEditor\(\)/, '/* viewer-only: no editor */')
    .replace(/if \(editMode\) buildEditor\(\)/, '/* viewer-only: no editor */')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/, '\n')
}

function usage() {
  console.log(`Usage: node build-viewer.mjs [--check]

  (default)  Write player.view.html from player.html
  --check    Exit 1 if player.view.html differs from generated output (byte-identical)`)
}

const check = process.argv.includes('--check')
if (process.argv.includes('-h') || process.argv.includes('--help')) {
  usage()
  process.exit(0)
}

const next = buildViewerSrc()

if (check) {
  if (!fs.existsSync(OUT)) {
    console.error('player.view.html missing; run without --check to generate')
    process.exit(1)
  }
  const cur = fs.readFileSync(OUT)
  const exp = Buffer.from(next, 'utf8')
  if (cur.length !== exp.length || !cur.equals(exp)) {
    console.error(`player.view.html out of sync (${cur.length} bytes vs ${exp.length} expected)`)
    console.error('Run: node build-viewer.mjs')
    process.exit(1)
  }
  console.log('player.view.html OK (byte-identical)')
  process.exit(0)
}

fs.writeFileSync(OUT, next, 'utf8')
console.log('player.view.html written')
