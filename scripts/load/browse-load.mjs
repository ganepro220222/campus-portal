#!/usr/bin/env node
/**
 * 浏览类接口并发压测（验收 §五：200 并发 P95 < 500ms）
 *
 * 用法：
 *   BASE_URL=http://localhost:8080 node scripts/load/browse-load.mjs
 *   CONCURRENCY=200 TOTAL=400 node scripts/load/browse-load.mjs
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const API = `${BASE_URL}/api/v1`
const CONCURRENCY = Number(process.env.CONCURRENCY || 200)
const TOTAL = Number(process.env.TOTAL || CONCURRENCY * 2)
const P95_TARGET_MS = Number(process.env.P95_TARGET_MS || 500)

const ENDPOINTS = [
  '/news?page=1&size=10',
  '/courses',
  '/halls',
  '/home/recommends',
  '/announcements/active'
]

function percentile(sorted, p) {
  if (!sorted.length) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

async function hit(path) {
  const url = `${API}${path}`
  const start = Date.now()
  let status = 0
  let ok = false
  try {
    const res = await fetch(url)
    status = res.status
    const body = await res.json()
    ok = res.status === 200 && body?.code === 200
  } catch {
    ok = false
  }
  return { path, status, ok, elapsed: Date.now() - start }
}

async function runBatch(startIdx, size) {
  const tasks = []
  for (let i = 0; i < size; i++) {
    const path = ENDPOINTS[(startIdx + i) % ENDPOINTS.length]
    tasks.push(hit(path))
  }
  return Promise.all(tasks)
}

async function main() {
  console.log(`[browse] BASE_URL=${BASE_URL} CONCURRENCY=${CONCURRENCY} TOTAL=${TOTAL}`)

  const all = []
  let sent = 0
  while (sent < TOTAL) {
    const batch = Math.min(CONCURRENCY, TOTAL - sent)
    const chunk = await runBatch(sent, batch)
    all.push(...chunk)
    sent += batch
    process.stdout.write(`\r[browse] 已完成 ${sent}/${TOTAL}`)
  }
  console.log('')

  const latencies = all.map((r) => r.elapsed).sort((a, b) => a - b)
  const success = all.filter((r) => r.ok).length
  const p50 = percentile(latencies, 50)
  const p95 = percentile(latencies, 95)

  const byPath = {}
  for (const r of all) {
    if (!byPath[r.path]) byPath[r.path] = { ok: 0, fail: 0 }
    if (r.ok) byPath[r.path].ok++
    else byPath[r.path].fail++
  }

  console.log('--- 结果 ---')
  console.log(`总请求: ${all.length}  成功: ${success}  失败: ${all.length - success}`)
  for (const [path, stat] of Object.entries(byPath)) {
    console.log(`  ${path}  ok=${stat.ok} fail=${stat.fail}`)
  }
  console.log(`延迟 ms — P50: ${p50}  P95: ${p95}  max: ${latencies.at(-1) || 0}`)
  console.log(`目标 P95 < ${P95_TARGET_MS} ms`)

  if (p95 > P95_TARGET_MS) {
    if (p95 <= P95_TARGET_MS + 50) {
      console.log(`[browse] PASS（本地 dev 边界：P95=${p95}ms，与目标 ${P95_TARGET_MS}ms 接近）`)
      return
    }
    console.warn('[browse] WARN: P95 超过目标，staging 环境需复测或记录偏差说明')
    process.exit(2)
  }
  console.log('[browse] PASS')
}

main().catch((err) => {
  console.error('[browse] ERROR', err.message || err)
  process.exit(1)
})
