#!/usr/bin/env node
/**
 * 护栏：小程序的颜色必须走令牌，旧调色板不许回潮。
 *
 * 已把「书院 · 檐棂印」的令牌搬进 app.wxss，并按一张对照表
 * 把各页写死的色值换成了令牌：wxss 里 477 处 → 70 处。
 * 剩下的 70 处是各页自己的语义色（分类色、海报底、空态插画），
 * 余下按页收，眼下先用棘轮卡住。
 *
 * 所以这条护栏管两件事：
 *
 *   ① 旧调色板的色值**一处都不许再出现**。
 *      这是回潮防线：以后谁从旧页面复制一段样式过来，这里会红。
 *
 *   ② 每个文件还剩多少写死的色值，用棘轮卡住：只能减，不能增。
 *      新文件默认预算 0 —— 新写的页面必须一上来就走令牌。
 *      每收掉一页，就把这里的数字改小（或删掉那一行）。
 *
 * 用法：node scripts/check-miniapp-design-tokens.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const MINI = path.join(root, 'miniapp')

/** 旧调色板。左边是值，右边是它当年的角色——报错时一起打出来，方便找替代令牌。 */
const LEGACY = {
  '#2B356E': '旧主色 navy        → var(--navy) / #7E6134',
  '#233362': '旧主色深           → var(--navy)',
  '#1E2654': '旧 navy-deep       → var(--navy-deep) / #614923',
  '#141A38': '旧 navy-ink        → var(--navy-ink) / #3F2F17',
  '#3F57B5': '旧次强调 blue      → var(--blue) / #9E7D45',
  '#5C72C9': '旧 blue-soft       → var(--blue-soft) / #C69E62',
  '#D0E7F7': '旧 sky             → var(--sky) / #CFE2DC',
  '#E8F2FB': '旧 sky-2           → var(--sky-2) / #E2EDE6',
  '#EAF1FB': '旧浅蓝底           → var(--sky-2)',
  '#F2F7FC': '旧 sky-3           → var(--sky-3) / #F2F5EE',
  '#F5F8FC': '旧页底 paper       → var(--paper) / #F7F3E8',
  '#1F2547': '旧正文 ink         → var(--ink) / #23262E',
  '#5A648A': '旧次要文字 sub     → var(--sub) / #4C505C',
  '#67708C': '旧提示文字 muted   → var(--muted) / #6B6459',
  '#8A93B2': '旧提示文字（更浅） → var(--muted)',
  '#C3CCE0': '旧空态图标色       → var(--ghost) / #D6CDB8',
  '#E7ECF6': '旧分割线 line      → var(--line) / #E4DCC8',
  '#BE9C44': '旧金 gold          → var(--jin-60) / #9E7D45',
  '#C0392B': '旧危险红           → var(--color-danger) / #9E2B25',
  '#FF4D4F': '旧危险红           → var(--color-danger)',
  '#52C41A': '旧成功绿           → var(--color-success) / #3F7A5E',
  '#FAAD14': '旧警告黄           → var(--color-warning) / #8F6216'
}

/** 这些文件不判旧色值：它们里面的颜色是被测数据，不是界面颜色。 */
const LEGACY_EXEMPT = new Set(['utils/content.test.js'])

/**
 * 每个 wxss 还允许留多少处写死的色值（棘轮，只减不增）。
 * 没列在这里的文件预算是 0。
 * 收拾完一页就把它的数字改小或整行删掉——数字比实际还大时这里也会报，
 * 免得棘轮松掉之后没人发现。
 */
const BUDGET = {
  'components/loading/index.wxss': 2,
  'components/skeleton/index.wxss': 1,
  'packageA/craft/detail.wxss': 7,
  'packageA/hall/detail.wxss': 7,
  'packageA/news/detail.wxss': 2,
  'packageB/course/detail.wxss': 1,
  'packageB/course/player.wxss': 1,
  'packageC/activity/detail.wxss': 1,
  'packageC/activity/enroll.wxss': 2,
  'packageC/legal/privacy.wxss': 4,
  'packageC/message/index.wxss': 2,
  'packageC/profile/list.wxss': 7,
  'packageC/search/index.wxss': 1,
  'packageD/poster/generate.wxss': 2,
  'pages/hall/index.wxss': 1,
  'pages/index/index.wxss': 8,
  'pages/login/index.wxss': 2,
  'pages/profile/index.wxss': 7,
  'styles/login-page.wxss': 2
}

const SKIP_DIRS = new Set(['node_modules', 'miniprogram_npm'])

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out)
    } else out.push(path.join(dir, e.name))
  }
  return out
}

function main() {
  const files = walk(MINI)
  const errs = []

  // ① 旧调色板不许回潮
  const scanExt = new Set(['.wxss', '.wxml', '.js', '.json'])
  for (const abs of files) {
    if (!scanExt.has(path.extname(abs))) continue
    const rel = path.relative(MINI, abs).split(path.sep).join('/')
    if (LEGACY_EXEMPT.has(rel)) continue
    const src = fs.readFileSync(abs, 'utf8')
    for (const [hex, role] of Object.entries(LEGACY)) {
      const re = new RegExp(hex.replace('#', '#') + '\\b(?![0-9a-fA-F])', 'ig')
      const hits = src.match(re)
      if (hits) errs.push(`${rel}：还有 ${hits.length} 处 ${hex}（${role}）`)
    }
  }

  // ② 写死色值的棘轮
  const seen = new Set()
  for (const abs of files) {
    if (path.extname(abs) !== '.wxss') continue
    const rel = path.relative(MINI, abs).split(path.sep).join('/')
    if (rel === 'app.wxss') continue          // 令牌本体住在这里
    const src = fs.readFileSync(abs, 'utf8')
    const n = (src.match(/#[0-9a-fA-F]{3,6}\b/g) || []).length
    const budget = BUDGET[rel] || 0
    if (n > budget) {
      errs.push(`${rel}：写死色值 ${n} 处，超出预算 ${budget} 处` +
                `\n      新加的颜色请走 app.wxss 的令牌；确实是这一页独有的语义色，` +
                `再来本文件把预算调上去并写清理由`)
    }
    if (BUDGET[rel] !== undefined) {
      seen.add(rel)
      if (n < budget) {
        errs.push(`${rel}：写死色值只剩 ${n} 处，预算却还写着 ${budget} —— ` +
                  `请把 BUDGET 里的数字改成 ${n}（或整行删掉），别让棘轮松掉`)
      }
    }
  }
  for (const rel of Object.keys(BUDGET)) {
    if (!seen.has(rel)) errs.push(`BUDGET 里的 ${rel} 已经不存在了，请把这一行删掉`)
  }

  if (errs.length) {
    console.error('check-miniapp-design-tokens 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  const left = Object.values(BUDGET).reduce((a, b) => a + b, 0)
  console.log(`check-miniapp-design-tokens OK（旧调色板已清零；` +
              `各页还剩 ${left} 处写死色值，随后按页收）`)
}

main()
