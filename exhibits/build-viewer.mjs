import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
let src = fs.readFileSync(path.join(ROOT, 'player.html'), 'utf8')
src = src.replace(/[ \t]*\/\* EDITOR-CSS-START[\s\S]*?\/\* EDITOR-CSS-END \*\/\n?/, '')
  .replace(/[ \t]*<!-- EDITOR-HTML-START[\s\S]*?<!-- EDITOR-HTML-END -->\n?/, '')
  .replace(/[ \t]*\/\* EDITOR-JS-START[\s\S]*?\/\* EDITOR-JS-END \*\/\n?/, '')
  .replace(/const editMode = params\.get\('mode'\) === 'edit'/, 'const editMode = false /* viewer-only */')
  .replace(/if \(editMode && typeof buildEditor === 'function'\) buildEditor\(\)/, '/* viewer-only: no editor */')
  .replace(/if \(editMode\) buildEditor\(\)/, '/* viewer-only: no editor */')
fs.writeFileSync(path.join(ROOT, 'player.view.html'), src)
console.log('player.view.html written')
