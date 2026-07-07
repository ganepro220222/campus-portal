#!/usr/bin/env node
/**
 * 50 并发报名压测（验收 §五、V1.1 门禁）
 * 前置：后端已启动 + 已执行 sql/patch-loadtest.sql
 *
 * 用法：
 *   BASE_URL=http://localhost:8080 node scripts/load/enroll-concurrent.mjs
 *   CONCURRENCY=50 ACTIVITY_ID=99 node scripts/load/enroll-concurrent.mjs
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const API = `${BASE_URL}/api/v1`
const ACTIVITY_ID = Number(process.env.ACTIVITY_ID || 99)
const CONCURRENCY = Number(process.env.CONCURRENCY || 50)
const PASSWORD = process.env.LOADTEST_PASSWORD || 'Admin@123'

function padUser(i) {
  return `loadtest${String(i).padStart(3, '0')}`
}

async function requestJson(path, options = {}) {
  const start = Date.now()
  const { headers: extraHeaders, ...rest } = options
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(extraHeaders || {})
    }
  })
  const elapsed = Date.now() - start
  let body
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { status: res.status, body, elapsed }
}

async function login(studentNo) {
  const { status, body } = await requestJson('/auth/account-login', {
    method: 'POST',
    body: JSON.stringify({ studentNo, password: PASSWORD })
  })
  if (status !== 200 || !body || body.code !== 200 || !body.data?.token) {
    throw new Error(`登录失败 ${studentNo}: HTTP ${status} ${body?.message || ''}`)
  }
  return body.data.token
}

async function enroll(token, index) {
  const body = {
    name: `压测${String(index).padStart(2, '0')}`,
    phone: `13800000${String(100 + index).padStart(3, '0')}`
  }
  return requestJson(`/activities/${ACTIVITY_ID}/enroll`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  })
}

async function fetchActivity() {
  const { body } = await requestJson(`/activities/${ACTIVITY_ID}`)
  return body?.data || null
}

function percentile(sorted, p) {
  if (!sorted.length) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
}

async function main() {
  console.log(`[load] BASE_URL=${BASE_URL} ACTIVITY_ID=${ACTIVITY_ID} CONCURRENCY=${CONCURRENCY}`)

  const before = await fetchActivity()
  if (!before) {
    console.error('[load] 活动不存在，请先执行 sql/patch-loadtest.sql')
    process.exit(1)
  }
  console.log(`[load] 压测前 quota=${before.quota} enrolled=${before.enrolledCount ?? before.enrolled_count}`)

  console.log('[load] 登录压测账号…')
  const tokens = await Promise.all(
    Array.from({ length: CONCURRENCY }, (_, i) => login(padUser(i + 1)))
  )

  console.log('[load] 并发报名…')
  const results = await Promise.all(tokens.map((t, i) => enroll(t, i + 1)))

  const ok = results.filter((r) => r.body?.code === 200).length
  const dup = results.filter((r) => r.body?.code !== 200 && /已报名/.test(r.body?.message || '')).length
  const full = results.filter((r) => r.body?.code !== 200 && /名额已满/.test(r.body?.message || '')).length
  const profile = results.filter((r) => r.body?.code !== 200 && /个人资料/.test(r.body?.message || '')).length
  const unauth = results.filter((r) => r.body?.code === 401).length
  const other = results.length - ok - dup - full - profile - unauth
  const latencies = results.map((r) => r.elapsed).sort((a, b) => a - b)

  const errSamples = [...new Set(
    results.filter((r) => r.body?.code !== 200).map((r) => `[${r.body?.code}] ${r.body?.message || '未知'}`)
  )].slice(0, 5)

  const after = await fetchActivity()
  const enrolled = after?.enrolledCount ?? after?.enrolled_count ?? -1
  const quota = after?.quota ?? before.quota

  console.log('--- 结果 ---')
  console.log(`成功报名: ${ok}`)
  console.log(`重复报名: ${dup}`)
  console.log(`名额已满: ${full}`)
  console.log(`资料不全: ${profile}`)
  console.log(`未登录: ${unauth}`)
  console.log(`其它失败: ${other}`)
  if (errSamples.length) {
    console.log('错误样例:', errSamples.join(' | '))
  }
  console.log(`报名后 enrolled_count: ${enrolled} / quota: ${quota}`)
  console.log(`延迟 ms — P50: ${percentile(latencies, 50)}  P95: ${percentile(latencies, 95)}  max: ${latencies.at(-1) || 0}`)

  const handled = ok + dup + full + profile + unauth
  const pass = enrolled <= quota && handled === CONCURRENCY && other === 0
  if (!pass) {
    if (enrolled > quota) {
      console.error('[load] FAIL: 报名人数超过名额上限')
    } else if (other > 0) {
      console.error('[load] FAIL: 存在未预期的错误响应')
    } else {
      console.error('[load] FAIL: 请求处理数与并发数不一致')
    }
    process.exit(1)
  }
  if (ok < CONCURRENCY && dup > 0) {
    console.log('[load] 提示: 部分账号已报名（重复），请先执行 sql/patch-loadtest.sql 重置后得 50 次新报名')
  }
  console.log('[load] PASS: 未超卖，并发报名业务响应正常')
}

main().catch((err) => {
  console.error('[load] ERROR', err.message || err)
  process.exit(1)
})
