#!/usr/bin/env node
/**
 * 用变异副本验证 check-ai-quota-guard 真的拦得住回退。
 *
 * 一条只会说 OK、从没红过的检查等于没有——之前就吃过这个亏（选择器写错、
 * 统计到 0 个元素也一样「通过」）。这里把每条规则单独打破一次，
 * 检查必须失败；全部规则都恢复原样时，检查必须通过。
 *
 * 用法：node scripts/test-ai-quota-guard.js
 */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const GUARD = path.join(__dirname, 'check-ai-quota-guard.js')

const FILES = [
  'backend/src/main/java/com/shuyuan/backend/config/RateLimitInterceptor.java',
  'backend/src/main/java/com/shuyuan/backend/service/RateLimitService.java',
  'miniapp/utils/request.js',
  'miniapp/utils/aiChat.js',
  'miniapp/packageD/ai-chat/index.js',
  'miniapp/components/ai-assistant/index.js'
]

/** 把受检文件复制到一棵临时树，返回临时根目录 */
function materialize() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-quota-guard-'))
  for (const rel of FILES) {
    const dest = path.join(dir, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(path.join(root, rel), dest)
  }
  return dir
}

function runGuard(dir) {
  const r = spawnSync(process.execPath, [GUARD], {
    encoding: 'utf8',
    env: { ...process.env, AI_QUOTA_GUARD_ROOT: dir }
  })
  return { status: r.status, out: (r.stdout || '') + (r.stderr || '') }
}

let failed = 0

function expectCaught(name, rel, mutate) {
  const dir = materialize()
  const file = path.join(dir, rel)
  const before = fs.readFileSync(file, 'utf8')
  const after = mutate(before)
  assert.notEqual(after, before, `变异「${name}」没有真的改动 ${rel}，用例本身失效了`)
  fs.writeFileSync(file, after)

  const { status, out } = runGuard(dir)
  fs.rmSync(dir, { recursive: true, force: true })
  if (status === 0) {
    failed++
    console.error(`  FAIL ${name} —— 打破了规则，检查却仍然通过`)
    console.error('       ' + out.trim())
  } else {
    console.log(`  ok  ${name}`)
  }
}

// 未变异的副本必须通过，否则后面的「失败」说明不了任何问题
{
  const dir = materialize()
  const { status, out } = runGuard(dir)
  fs.rmSync(dir, { recursive: true, force: true })
  if (status !== 0) {
    console.error('test-ai-quota-guard: 未变异的副本就没通过，检查或基线有问题')
    console.error(out)
    process.exit(1)
  }
  console.log('  ok  未变异副本通过')
}

expectCaught('退还边界放宽到 4xx', FILES[0],
  (s) => s.replace('response.getStatus() < 500', 'response.getStatus() < 400'))

// 注意用全局替换：String.replace 传字符串只换第一处，而第一处在类注释里，
// 签名根本没动——这条用例最早就是这么「假通过」的
expectCaught('删掉 afterCompletion', FILES[0],
  (s) => s.replace(/afterCompletion/g, 'afterCompletionDisabled'))

expectCaught('退还改回裸 DECR', FILES[1],
  (s) => s.replace(/redis\.execute\(REFUND_SCRIPT[^;]*;/, 'redis.opsForValue().decrement(redisKey);'))

expectCaught('后台超限文案退回兜底', FILES[1],
  (s) => s.replace(/case SCENE_AI_POLISH -> [^;]*;/, 'case SCENE_AI_POLISH -> "操作过于频繁，请稍后再试";'))

expectCaught('小程序超限原文被改', FILES[1],
  (s) => s.replace('今日问答次数已用完，请明天再来', '今日次数已用完'))

expectCaught('request 又把 timeout 写死', FILES[2],
  (s) => s.replace('timeout: resolveTimeout(options)', 'timeout: 10000'))

expectCaught('AI 提问超时缩回默认值', FILES[3],
  (s) => s.replace(/const ASK_TIMEOUT = \d+/, 'const ASK_TIMEOUT = 10000'))

expectCaught('sendQuestion 不再传超时', FILES[3],
  (s) => s.replace(', { timeout: ASK_TIMEOUT, silent: true }', ''))

expectCaught('sendQuestion 去掉 silent', FILES[3],
  (s) => s.replace(
    '{ timeout: ASK_TIMEOUT, silent: true }',
    '{ timeout: ASK_TIMEOUT, silent: false }'
  ))

expectCaught('去掉网络错误专用文案', FILES[3],
  (s) => s.replace("'网络连接失败，请检查网络后重试。'", "'请确认已登录'"))

expectCaught('问答页写死 dailyLimit', FILES[4],
  (s) => s.replace('exhaustedQuota(this.data.quota)',
    '{ needLogin: false, dailyLimit: 20, used: 20, remaining: 0 }'))

expectCaught('助手浮标写死 dailyLimit', FILES[5],
  (s) => s.replace('exhaustedQuota(this.data.quota)',
    '{ needLogin: false, dailyLimit: 20, used: 20, remaining: 0 }'))

if (failed) {
  console.error(`test-ai-quota-guard: ${failed} 条规则形同虚设`)
  process.exit(1)
}
console.log('test-ai-quota-guard: PASS')
