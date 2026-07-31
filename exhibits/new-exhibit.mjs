#!/usr/bin/env node
/** Interactive CLI: create exhibit from _template. */
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createExhibit, suggestNextExhibitDir } from './exhibit-create.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)

function ask(q, def = '') {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const prompt = def ? `${q} [${def}]: ` : `${q}: `
  return new Promise(resolve => rl.question(prompt, ans => { rl.close(); resolve((ans || def).trim()) }))
}

async function main() {
  let dir = args[0]
  let title = args[1]
  let subtitle = args[2] || ''

  const suggested = suggestNextExhibitDir(ROOT)
  if (!dir) dir = await ask('展品编号（如 005 或 craft-005）', suggested.replace(/^craft-/i, ''))
  if (!title) title = await ask('展品名称（左上角显示）')

  const result = createExhibit(ROOT, { dir, title, subtitle })
  console.log('')
  console.log('[OK] 已创建', result.dir)
  console.log('  名称:', result.title)
  console.log('  目录:', path.join(ROOT, result.dir))
  console.log('')
  console.log('下一步：')
  console.log('  1. 把 model.glb 放入', path.join(result.dir, 'assets'))
  console.log('  2. 刷新工作台 → 点「编辑」→ 调相机/热点 → 保存')
  console.log('')
  if (process.platform === 'win32') {
    spawn('explorer.exe', [result.assetsDir], { detached: true, stdio: 'ignore' }).unref()
  }
}

main().catch(e => {
  console.error('[ERROR]', e.message)
  process.exit(1)
})
