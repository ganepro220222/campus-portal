#!/usr/bin/env node
/**
 * 直连智谱 GLM API 冒烟（读取仓库根 .env 的 AI_*，Key 不进 Git）。
 * 用法：node scripts/test-zhipu-ai.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const envPath = path.join(root, '.env')

function loadEnv(file) {
  const out = {}
  if (!fs.existsSync(file)) {
    return out
  }
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i <= 0) continue
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return out
}

async function main() {
  const env = { ...process.env, ...loadEnv(envPath) }
  const apiKey = env.AI_API_KEY
  const baseUrl = (env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/$/, '')
  const model = env.AI_MODEL || 'glm-4.5-flash'

  if (!apiKey || apiKey.includes('your-zhipu')) {
    console.error('[test-zhipu-ai] 请在 .env 中设置 AI_API_KEY')
    process.exit(1)
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: '用一句话说「你好」' }],
      thinking: { type: 'disabled' },
      temperature: 0.7,
      max_tokens: 64,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error(`[test-zhipu-ai] HTTP ${res.status}: ${text.slice(0, 500)}`)
    process.exit(1)
  }

  const data = JSON.parse(text)
  const reply = data?.choices?.[0]?.message?.content
  if (!reply) {
    console.error('[test-zhipu-ai] 响应无 content:', text.slice(0, 300))
    process.exit(1)
  }
  console.log('[test-zhipu-ai] 通过')
  console.log(`  model: ${model}`)
  console.log(`  reply: ${reply.trim().slice(0, 120)}`)
}

main().catch((e) => {
  console.error('[test-zhipu-ai] 失败:', e.message)
  process.exit(1)
})
