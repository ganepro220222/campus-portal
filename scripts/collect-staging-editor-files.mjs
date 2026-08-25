#!/usr/bin/env node
/** 列出 staging 编辑器部署须同步的 exhibits/ 相对路径（一行一个）。 */
import { collectStagingEditorRelPaths, collectStagingExhibitsCheckoutPaths } from '../exhibits/staging-editor-paths.mjs'

const asRepoPaths = process.argv.includes('--repo')
const paths = asRepoPaths ? collectStagingExhibitsCheckoutPaths() : collectStagingEditorRelPaths()
for (const p of paths) console.log(p)
