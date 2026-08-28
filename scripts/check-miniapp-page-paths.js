#!/usr/bin/env node
/**
 * 小程序 app.json 页面路径与磁盘文件一致性检查。
 *
 * 真出过的问题：
 *   - app.json 写 "profile/change-password"，文件却在 change-password/index.*，
 *     开发者工具报「未找到 change-password.wxml」；
 *   - 同一路径既有 change-password.js 又有 change-password/index.js（工具误生成的占位页），
 *     编译行为不可预期。
 *
 * 约定：app.json 里注册的页面路径 P，必须存在 miniapp/{分包根}/{P}.wxml 与 .js。
 * 目录式页面须在路径末尾写 /index（如 search/index、profile/change-password/index）。
 *
 * 另：主包 page 的 wxss 不能「只有 @import」——在 bundle:true 下曾触发主包白屏。
 *
 * 用法：node scripts/check-miniapp-page-paths.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const miniappDir = path.join(root, 'miniapp')

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(miniappDir, rel), 'utf8'))
}

/** 收集 app.json 声明的全部页面：{ relPath, main } */
function collectPages() {
  const cfg = readJson('app.json')
  const out = []
  for (const p of cfg.pages || []) {
    out.push({ relPath: p.replace(/\\/g, '/'), main: true })
  }
  for (const sub of cfg.subpackages || []) {
    const subRoot = (sub.root || '').replace(/\\/g, '/')
    for (const p of sub.pages || []) {
      const rel = subRoot ? `${subRoot}/${p}` : p
      out.push({ relPath: rel.replace(/\\/g, '/'), main: false })
    }
  }
  return out
}

function pageBase(relPath) {
  return path.join(miniappDir, relPath.replace(/\//g, path.sep))
}

function existsFile(base, ext) {
  return fs.existsSync(`${base}${ext}`)
}

/** 扫描 miniapp 下 foo.js 与 foo/index.js 并存 */
function findDuplicatePageFiles() {
  const dup = []
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      if (name === 'node_modules' || name.startsWith('.')) continue
      const full = path.join(dir, name)
      const st = fs.statSync(full)
      if (st.isDirectory()) {
        const flatJs = `${full}.js`
        const indexJs = path.join(full, 'index.js')
        if (fs.existsSync(flatJs) && fs.existsSync(indexJs)) {
          dup.push(path.relative(miniappDir, flatJs).replace(/\\/g, '/'))
        }
        walk(full)
      }
    }
  }
  walk(miniappDir)
  return dup
}

/** 主包 wxss 是否仅有 @import（无实际样式规则） */
function isImportOnlyWxss(content) {
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .trim()
  if (!stripped) return false
  const lines = stripped.split('\n').map((l) => l.trim()).filter(Boolean)
  return lines.length > 0 && lines.every((l) => /^@import\s+["'][^"']+["']\s*;?$/.test(l))
}

function main() {
  const errs = []
  const pages = collectPages()

  for (const { relPath, main } of pages) {
    const base = pageBase(relPath)
    if (!existsFile(base, '.wxml')) {
      errs.push(
        `app.json 页面「${relPath}」缺少 ${path.relative(root, base + '.wxml')}；` +
          '目录式页面请在 app.json 路径末尾加 /index'
      )
    }
    if (!existsFile(base, '.js')) {
      errs.push(`app.json 页面「${relPath}」缺少 ${path.relative(root, base + '.js')}`)
    }
  }

  for (const rel of findDuplicatePageFiles()) {
    errs.push(
      `同一路径存在 ${rel} 与 ${rel.replace(/\.js$/, '/index.js')}，` +
        '请删除开发者工具误生成的占位文件，只保留一套'
    )
  }

  for (const { relPath, main } of pages) {
    if (!main) continue
    const wxssPath = `${pageBase(relPath)}.wxss`
    if (!fs.existsSync(wxssPath)) continue
    const content = fs.readFileSync(wxssPath, 'utf8')
    if (isImportOnlyWxss(content)) {
      errs.push(
        `主包页面 ${relPath}.wxss 仅含 @import，在 bundle:true 下可能导致主包编译白屏；` +
          '请内联样式或把页面移到分包'
      )
    }
  }

  if (errs.length) {
    console.error('check-miniapp-page-paths 失败：\n' + errs.map((e) => '  - ' + e).join('\n'))
    process.exit(1)
  }
  console.log(`check-miniapp-page-paths OK（${pages.length} 个页面）`)
}

main()
