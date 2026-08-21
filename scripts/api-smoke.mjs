#!/usr/bin/env node
/**
 * 本地 Docker 后端 API 冒烟（Apifox P0 子集，无需 token 的公开读接口 + health）。
 *
 * 用法：
 *   docker compose -f docker-compose.dev.yml up -d
 *   npm run smoke:api
 *   BASE_URL=http://127.0.0.1:8080 npm run smoke:api
 */

const BASE = (process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const API = `${BASE}/api/v1`

const CASES = [
  {
    name: 'health',
    url: `${API}/health`,
    assert(body) {
      return body?.code === 200 && body?.data?.status === 'UP'
    }
  },
  { name: 'news', path: '/news?page=1&size=5' },
  { name: 'halls', path: '/halls' },
  { name: 'courses', path: '/courses' },
  { name: 'activities', path: '/activities?page=1&size=5' },
  { name: 'home-recommends', path: '/home/recommends' },
  { name: 'announcements', path: '/announcements/active' }
]

async function fetchJson(url) {
  const res = await fetch(url)
  let body
  try {
    body = await res.json()
  } catch {
    body = null
  }
  return { res, body }
}

async function runCase(c) {
  const url = c.url || `${API}${c.path}`
  const { res, body } = await fetchJson(url)
  const ok = typeof c.assert === 'function'
    ? c.assert(body)
    : res.status === 200 && body?.code === 200
  return { name: c.name, url, ok, status: res.status, code: body?.code }
}

async function main() {
  console.log(`[api-smoke] BASE_URL=${BASE}`)
  const results = []
  for (const c of CASES) {
    const r = await runCase(c)
    results.push(r)
    console.log(`${r.ok ? '  ok' : ' FAIL'}  ${r.name}  HTTP ${r.status}${r.code != null ? ` code=${r.code}` : ''}`)
  }
  const failed = results.filter(r => !r.ok)
  if (failed.length) {
    console.error(`\napi-smoke: ${failed.length}/${results.length} 失败 — 确认 Docker 后端已启动且 seed 可用`)
    process.exit(1)
  }
  console.log(`\napi-smoke OK（${results.length} 项）`)
}

main().catch(err => {
  console.error('[api-smoke] 请求异常:', err.message)
  console.error('提示：先执行 docker compose -f docker-compose.dev.yml up -d')
  process.exit(1)
})
