#!/usr/bin/env node
/** deploy-admin-staging.ps1 静态检查：退出码、清 dist、原子 swap。 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ps1 = fs.readFileSync(path.join(ROOT, 'scripts/deploy-admin-staging.ps1'), 'utf8')

assert.match(ps1, /function Assert-LastExitCode/)
assert.match(ps1, /Assert-LastExitCode 'npm run build'/)
assert.match(ps1, /Assert-LastExitCode 'scp upload'/)
assert.match(ps1, /Assert-LastExitCode 'ssh swap dist'/)
assert.match(ps1, /Remove-Item -LiteralPath \$Dist -Recurse -Force/)
assert.match(ps1, /Assert-AdminDistAssets/)
assert.match(ps1, /\.staging/)
assert.match(ps1, /\.old/)

console.log('deploy-admin-staging.test: PASS')
