#!/usr/bin/env node
/**
 * AI 额度这条链上，几个「改回去不会有任何报错、但会安静地坏掉」的约定。
 *
 * 1) 退还只认 5xx。放宽到 4xx 看着更「体贴」，实际是把限流废掉——
 *    拿不合法的入参就能无限次敲这些接口，一次也不计数。
 * 2) 退还必须走 EXISTS 守卫的 Lua。裸 DECR 对不存在的键会新建 -1 且**不带 TTL**，
 *    请求跨过窗口边界时就会留下永不过期的负数键，用户凭空多出额度。
 * 3) AI 提问的超时必须能单独放宽。默认 10 秒跑不完「检索 + 大模型生成」，
 *    而超时那一刻服务端往往已经成功、答案已入库、次数照扣——用户只看到一句失败。
 *    后台润色/扩写同理：axios 默认 30s，智谱服务端最多等 60s，客户端必须更长。
 * 4) 按天的额度必须说「今天用完了」。落进「操作过于频繁，请稍后再试」的兜底文案，
 *    用户会理解成歇一会儿就能接着用，于是反复点、反复看到同一句。
 * 5) 上限值由服务端配置下发，端上不许再各写一份字面量。
 *
 * 用法：node scripts/check-ai-quota-guard.js
 */
const fs = require('node:fs')
const path = require('node:path')

// 允许指向一棵临时目录树，供 test-ai-quota-guard.js 用变异副本验证本检查确实会拦住回退
const root = process.env.AI_QUOTA_GUARD_ROOT || path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const interceptor = read('backend/src/main/java/com/shuyuan/backend/config/RateLimitInterceptor.java')
const service = read('backend/src/main/java/com/shuyuan/backend/service/RateLimitService.java')
const request = read('miniapp/utils/request.js')
const aiChat = read('miniapp/utils/aiChat.js')
const adminAi = read('admin/src/api/ai.ts')

const errs = []

// ---------- 1) 退还边界 ----------
// 认方法签名而不是「文中出现过这个词」——注释里提一句可不算实现
if (!/public void afterCompletion\(/.test(interceptor)) {
  errs.push('RateLimitInterceptor 缺少 afterCompletion，失败的请求会白吃用户一次额度')
}
if (!/response\.getStatus\(\)\s*<\s*500/.test(interceptor)) {
  errs.push('退还边界不再是 5xx —— 4xx 也退等于放弃限流，任何非法请求都能无限次重来')
}
if (/response\.getStatus\(\)\s*[<>]=?\s*4\d\d/.test(interceptor)) {
  errs.push('RateLimitInterceptor 里出现了 4xx 的退还判断')
}
if (!/refundKey/.test(interceptor)) {
  errs.push('RateLimitInterceptor 没有调用 refundKey')
}

// ---------- 2) 退还的原子性 ----------
if (!/DECR/.test(service) || !/GET/.test(service)) {
  errs.push('RateLimitService 退还脚本缺少「读计数再减」的 Lua 守卫')
}
if (/opsForValue\(\)\.decrement\(/.test(service)) {
  errs.push('RateLimitService 仍有裸 DECR：键过期后会造出无 TTL 的负数键')
}
if (!/public void refundKey/.test(service)) {
  errs.push('RateLimitService 缺少 refundKey')
}

// ---------- 3) AI 提问的超时 ----------
// 只看 request()（wx.request）这一段；upload() 的 60 秒是文件上传自己的事，与此无关
const requestFn = request.slice(
  request.indexOf('const request ='),
  request.indexOf('const upload =')
)
if (!requestFn.includes('const request =') || !requestFn.length) {
  errs.push('request.js 结构变了，无法定位 request() —— 请同步更新本检查')
}
if (/timeout:\s*\d+/.test(requestFn)) {
  errs.push('request() 里仍有写死的 timeout，AI 问答无法单独放宽')
}
if (!/timeout:\s*resolveTimeout\(options\)/.test(requestFn)) {
  errs.push('request() 没有把 options.timeout 透传给 wx.request')
}
const askTimeout = aiChat.match(/const ASK_TIMEOUT = (\d+)/)
if (!askTimeout) {
  errs.push('aiChat.js 缺少 ASK_TIMEOUT')
} else if (Number(askTimeout[1]) <= 10000) {
  errs.push(`ASK_TIMEOUT=${askTimeout[1]} 不比默认的 10000 宽，等于没放宽`)
}
if (!/sendQuestion[\s\S]{0,280}?timeout:\s*ASK_TIMEOUT/.test(aiChat)) {
  errs.push('sendQuestion 没有把 ASK_TIMEOUT 传下去')
}
const polishTimeout = adminAi.match(/AI_POLISH_TIMEOUT_MS\s*=\s*([\d_]+)/)
if (!polishTimeout) {
  errs.push('admin/src/api/ai.ts 缺少 AI_POLISH_TIMEOUT_MS')
} else if (Number(polishTimeout[1].replace(/_/g, '')) <= 30000) {
  errs.push(`AI_POLISH_TIMEOUT_MS=${polishTimeout[1]} 不比后台默认 30000 宽，扩写会被 axios 先掐断`)
}
if (!/timeout:\s*AI_POLISH_TIMEOUT_MS/.test(adminAi)) {
  errs.push('polishContent 没有把 AI_POLISH_TIMEOUT_MS 传给 post')
}
if (!/async function sendQuestion[\s\S]{0,220}?silent:\s*true/.test(aiChat)) {
  errs.push('sendQuestion 未设 silent:true，超时后通用 toast 会与 AI 页专用提示冲突')
}
if (!/function isNetworkError/.test(aiChat)) {
  errs.push('aiChat.js 缺少 isNetworkError，silent 后断网无法给出专用提示')
}
if (!/isNetworkError\(err\)[\s\S]{0,120}?网络连接失败/.test(aiChat)) {
  errs.push('resolveErrorAnswer 未对普通 request:fail 给出网络专用文案')
}

// ---------- 4) 按天额度的文案 ----------
for (const scene of ['SCENE_AI', 'SCENE_AI_POLISH']) {
  if (!new RegExp(`case ${scene} ->`).test(service)) {
    errs.push(`RateLimitService.limitMessage 缺少 ${scene} 的专属文案，会落到「操作过于频繁」兜底`)
  }
}
if (!/今日 AI 文案辅助次数已用完/.test(service)) {
  errs.push('后台 AI 辅助超限文案缺失')
}
if (!/今日问答次数已用完，请明天再来/.test(service)) {
  errs.push('小程序问答超限文案被改动（端上多处依赖这句原文）')
}

// ---------- 5) 端上不许再写死上限 ----------
const pages = [
  'miniapp/packageD/ai-chat/index.js',
  'miniapp/components/ai-assistant/index.js'
]
for (const p of pages) {
  if (/dailyLimit:\s*\d+/.test(read(p))) {
    errs.push(`${p} 里写死了 dailyLimit，服务端调整额度后这里会显示旧值`)
  }
}

if (errs.length) {
  console.error('check-ai-quota-guard 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-ai-quota-guard OK')
