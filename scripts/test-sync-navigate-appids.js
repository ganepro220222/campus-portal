#!/usr/bin/env node
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.join(__dirname, '..')
const appJsonPath = path.join(root, 'miniapp/app.json')
const backupPath = appJsonPath + '.bak-test'
const testConfig = path.join(root, 'miniapp/config/.navigate-appids.test.json')

function run() {
  const original = fs.readFileSync(appJsonPath, 'utf8')
  fs.writeFileSync(backupPath, original, 'utf8')
  try {
    fs.writeFileSync(testConfig, JSON.stringify({
      appIds: [
        { appId: 'wxTEST1111111111', name: 'test1' },
        { appId: 'wxPLACEHOLDER_SKIP', name: 'skip' },
        'wxTEST2222222222'
      ]
    }, null, 2), 'utf8')

    execFileSync(process.execPath, [
      path.join(__dirname, 'sync-navigate-appids.js'),
      '--config', testConfig
    ], { stdio: 'pipe' })

    const updated = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'))
    assert.deepStrictEqual(updated.navigateToMiniProgramAppIdList, [
      'wxTEST1111111111',
      'wxTEST2222222222'
    ])
    console.log('[test-sync-navigate-appids] 通过')
  } finally {
    fs.writeFileSync(appJsonPath, fs.readFileSync(backupPath, 'utf8'), 'utf8')
    fs.unlinkSync(backupPath)
    if (fs.existsSync(testConfig)) fs.unlinkSync(testConfig)
  }
}

run()
