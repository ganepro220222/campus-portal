#!/usr/bin/env node
/** check-spring-bean-cycles 双向验证：注入假环应失败，恢复后应通过 */
const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const script = path.join(__dirname, 'check-spring-bean-cycles.js')
const fakeDir = path.join(root, 'backend/src/main/java/com/shuyuan/backend/_cycle_gate_probe')
const fileA = path.join(fakeDir, 'CycleProbeA.java')
const fileB = path.join(fakeDir, 'CycleProbeB.java')

function run() {
  execSync(`node "${script}"`, { stdio: 'pipe', cwd: root })
}

function cleanup() {
  if (fs.existsSync(fakeDir)) {
    fs.rmSync(fakeDir, { recursive: true, force: true })
  }
}

const srcA = `package com.shuyuan.backend._cycle_gate_probe;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
@Service
@RequiredArgsConstructor
public class CycleProbeA {
  private final CycleProbeB b;
}
`
const srcB = `package com.shuyuan.backend._cycle_gate_probe;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
@Service
@RequiredArgsConstructor
public class CycleProbeB {
  private final CycleProbeA a;
}
`

run()

fs.mkdirSync(fakeDir, { recursive: true })
fs.writeFileSync(fileA, srcA)
fs.writeFileSync(fileB, srcB)
try {
  run()
  console.error('FAIL: expected failure when synthetic cycle injected')
  process.exit(1)
} catch {
  // expected
} finally {
  cleanup()
}

run()
console.log('test-spring-bean-cycles: PASS')
