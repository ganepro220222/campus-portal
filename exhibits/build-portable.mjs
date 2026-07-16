#!/usr/bin/env node
/**
 * 便携单文件打包器 —— 把某个展品打成一个「双击即开」的 .html
 *
 *   node build-portable.mjs [展品目录=craft-001]
 *
 * 产物：<展品目录>.portable.html
 *   - 内联 Three.js（esbuild 打成一个经典脚本，无 ES 模块/无 importmap）
 *   - 内联 config + 模型/全景/封面/音频（全部转 data: URI）
 *   - 无 fetch、无外部依赖 → 可直接双击（file://）打开、可离线、可当附件发给非技术同事
 *
 * 局限：便携版为「观看版」（无编辑器）；且因解码器需按路径加载，
 *       便携版不支持 Draco/KTX2 压缩模型（普通 .glb 正常）。压缩模型请用 http 部署版。
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { resolve, join, dirname, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const __dir = dirname(fileURLToPath(import.meta.url))
const require = createRequire(pathToFileURL(join(__dir, '../viewer/package.json')))
const esbuild = require('esbuild')

const exhibit = (process.argv[2] || 'craft-001').replace(/\/+$/, '')
const dir = resolve(__dir, exhibit)
const vendor = join(dir, 'vendor')
const threeModule = join(vendor, 'three.module.js')
const addonsDir = join(vendor, 'addons')

const MIME = { '.glb':'model/gltf-binary', '.gltf':'model/gltf+json', '.jpg':'image/jpeg', '.jpeg':'image/jpeg',
  '.png':'image/png', '.webp':'image/webp', '.wav':'audio/wav', '.mp3':'audio/mpeg', '.m4a':'audio/mp4', '.ogg':'audio/ogg' }

function toDataURI(relPath) {
  if (!relPath || /^(https?:|data:)/.test(relPath)) return relPath      // 外链/已是 data: 保持不变
  const abs = join(dir, relPath)
  try {
    const buf = readFileSync(abs)
    const mime = MIME[extname(abs).toLowerCase()] || 'application/octet-stream'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch (e) { console.warn(`  ⚠ 资源缺失，保持原路径：${relPath}`); return relPath }
}

// 1) 读取 index.html，抽出内联 module 脚本
const html = readFileSync(join(dir, 'index.html'), 'utf8')
const mod = html.match(/<script type="module">([\s\S]*?)<\/script>/)
if (!mod) { console.error('未找到 <script type="module">'); process.exit(1) }
// 便携版是观看版：剔除编辑器 JS 段（更小、且无编辑器 DOM）
let entry = mod[1].replace(/\/\* EDITOR-JS-START[\s\S]*?\/\* EDITOR-JS-END \*\//, '')

// 2) esbuild 打包（把 three / three/addons 解析到 vendor，产出单个经典脚本）
const threeResolver = {
  name: 'three-resolver',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: threeModule }))
    b.onResolve({ filter: /^three\/addons\// }, args => ({ path: join(addonsDir, args.path.replace('three/addons/', '')) }))
  }
}
const out = await esbuild.build({
  stdin: { contents: entry, resolveDir: dir, loader: 'js' },
  bundle: true, format: 'iife', minify: true, write: false, legalComments: 'none', target: 'es2020',
  plugins: [threeResolver]
})
const bundledJS = out.outputFiles[0].text

// 3) config + 资源内联为 data: URI
const cfg = JSON.parse(readFileSync(join(dir, 'config.json'), 'utf8'))
if (cfg.assets) { cfg.assets.model = toDataURI(cfg.assets.model); cfg.assets.panorama = toDataURI(cfg.assets.panorama); cfg.assets.poster = toDataURI(cfg.assets.poster) }
;(cfg.audio || []).forEach(a => { if (a) a.src = toDataURI(a.src) })

// 4) 组装输出 HTML：去 importmap / module 脚本 / 编辑器 HTML·CSS，注入内联 config + 打包脚本
let shell = html
  .replace(/[ \t]*<script type="importmap">[\s\S]*?<\/script>\n?/, '')
  .replace(/[ \t]*<script type="module">[\s\S]*?<\/script>\n?/, '')
  .replace(/[ \t]*\/\* EDITOR-CSS-START[\s\S]*?\/\* EDITOR-CSS-END \*\/\n?/, '')
  .replace(/[ \t]*<!-- EDITOR-HTML-START[\s\S]*?<!-- EDITOR-HTML-END -->\n?/, '')
const inject = `<script>window.__CFG__=${JSON.stringify(cfg)}</script>\n<script>${bundledJS}</script>\n`
shell = shell.replace('</body>', () => inject + '</body>')   // 函数替换：避免 $ 被当作特殊模式（脚本里大量 $(...)）

const outFile = join(__dir, `${exhibit}.portable.html`)
writeFileSync(outFile, shell)
const mb = (statSync(outFile).size / 1048576).toFixed(2)
console.log(`✅ 已生成便携单文件：${exhibit}.portable.html （${mb} MB）— 双击即可打开，可离线、可发送`)
