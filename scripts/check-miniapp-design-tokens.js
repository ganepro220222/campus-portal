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
  /* app.wxss 令牌区**以下**那段共用样式。原来整个文件被跳过，
     这 18 处就藏在那个盲区里：.hc1~.hc5 的展馆色阶（旧蓝紫）、
     .ft-* 的文件类型色、收藏态那几个冷粉。展馆封面改成装裱画心时
     .hc* 会一起收掉，这里跟着往下调。 */
  'app.wxss': 18,
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
  'pages/index/index.wxss': 6,
  'pages/login/index.wxss': 2,
  'pages/profile/index.wxss': 7,
  'styles/login-page.wxss': 2
}

/**
 * 旧调色板换了写法之后，每个文件还剩多少处（棘轮，只减不增）。
 * 没列在这里的文件预算是 0。数字是补上这条检查当天量出来的实际分布。
 * 两个招牌页（pages/login、pages/index）的数字留到第 4 批整页重做时归零；
 * styles/login-page.wxss **没有任何文件 @import 它**，是份死文件，
 * 里面这 5 处随它一起删掉就没了。
 */
const DISGUISED_BUDGET = {
  'app.wxss': 3,
  'packageA/news/detail.wxss': 1,
  'packageA/news/list.wxss': 1,
  'packageB/course/detail.wxss': 1,
  'packageB/course/player.wxss': 1,
  'packageC/activity/detail.wxss': 4,
  'packageC/activity/enroll.wxss': 2,
  'packageC/feedback/index.wxss': 1,
  'packageC/profile/list.wxss': 4,
  'packageD/poster/generate.wxss': 1,
  'pages/profile/index.wxss': 4,
  'styles/login-page.wxss': 6
}

/**
 * 把 app.wxss 的令牌区切掉，只留下面那些共用样式。
 *
 * 这条原来是 `if (rel === 'app.wxss') continue` —— **整个文件跳过**。
 * 理由写的是"令牌本体住在这里"，没错，但 app.wxss 里住的不止令牌：
 * 令牌区下面还有一大段共用组件样式（.hc1~.hc5 的展馆色阶、
 * .s1~.s3 的轮播色阶、.ft-* 的文件类型色…），那些是**界面颜色**，
 * 本来就该走令牌。整文件跳过等于把它们放进了一个谁也看不见的角落：
 * 旧蓝紫调色板的一批硬编码色值就一直在那儿，流水线全绿。
 *
 * 轮播那块灰褐方块就是这么来的——.s1 写着
 * linear-gradient(var(--navy-deep), var(--blue))，别名令牌把它换算成棕金，
 * 照片又被压到 32% 叠在上面，出来谁也认不出是什么。
 *
 * 现在只跳过两个 sentinel 之间的令牌区，其余照常上棘轮。
 */
function stripTokenBlock(src) {
  const a = src.indexOf('/* ══ 令牌区开始')
  const b = src.indexOf('/* ══ 令牌区结束')
  if (a < 0 || b < 0 || b < a) {
    // 标记没了就别默默放行——那正是这条检查要防的情况
    throw new Error('app.wxss 里找不到令牌区的起止标记，无法判断哪些颜色该上棘轮')
  }
  return src.slice(0, a) + src.slice(b)
}

/** 旧调色板的 rgb 形式查找表：'r,g,b' → hex */
const LEGACY_RGB = {}
for (const hex of Object.keys(LEGACY)) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  LEGACY_RGB[`${r},${g},${b}`] = hex
}

/** 数一个文件里旧调色板的「伪装写法」有多少处 */
function countDisguised(src) {
  let n = 0
  for (const m of src.matchAll(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g)) {
    if (LEGACY_RGB[`${+m[1]},${+m[2]},${+m[3]}`]) n++
  }
  for (const m of src.matchAll(/%23([0-9A-Fa-f]{6})\b/g)) {
    if (LEGACY['#' + m[1].toUpperCase()]) n++
  }
  return n
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
  const disguised = {}                      // rel → 该文件的伪装形式命中数
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
    const n = countDisguised(src)
    if (n) disguised[rel] = n
  }

  // ①-b 同一批颜色的**另外两种写法**。
  //
  // 上面那段只认 `#RRGGBB`。可这批色值还能写成别的样子，写出来一模一样：
  //   · `rgba(208, 231, 247, .22)` —— 就是 #D0E7F7；
  //   · data-URI 里的 `%23D0E7F7` —— `#` 在 URI 里要转义，所以写成 %23。
  // 两种写法上面的正则一个都抓不到。结果是护栏打印"旧调色板已清零"，
  // 登录页的波浪装饰里却一直躺着 %23D0E7F7 和 rgba(208,231,247)，
  // 整页还是旧配色，而流水线是绿的。这条护栏自己说了假话一个周期。
  //
  // 补上之后一次冒出 36 处，分布在 14 个文件里，多数属于后面几批的页面。
  // 所以这里不是一刀切成红，而是和 ② 一样上棘轮：数字**只能减不能增**，
  // 收掉一页就把那一行改小或删掉。比"先全绿着"诚实，比"全红着"能落地。
  for (const [rel, n] of Object.entries(disguised)) {
    const budget = DISGUISED_BUDGET[rel] || 0
    if (n > budget) {
      errs.push(`${rel}：旧调色板换了写法混进来 ${n} 处（rgb()/rgba() 或 %23），` +
                `超出预算 ${budget} 处\n` +
                `      这些值和 #hex 写法是同一批颜色，请一并换成令牌`)
    }
  }
  for (const [rel, budget] of Object.entries(DISGUISED_BUDGET)) {
    const n = disguised[rel] || 0
    if (!fs.existsSync(path.join(MINI, rel))) {
      errs.push(`DISGUISED_BUDGET 里的 ${rel} 已经不存在了，请把这一行删掉`)
    } else if (n < budget) {
      errs.push(`${rel}：伪装形式只剩 ${n} 处，预算却还写着 ${budget} —— ` +
                `请改成 ${n}（或整行删掉），别让棘轮松掉`)
    }
  }

  // ② 写死色值的棘轮
  const seen = new Set()
  for (const abs of files) {
    if (path.extname(abs) !== '.wxss') continue
    const rel = path.relative(MINI, abs).split(path.sep).join('/')
    let src = fs.readFileSync(abs, 'utf8')
    if (rel === 'app.wxss') src = stripTokenBlock(src)
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
  const dis = Object.values(DISGUISED_BUDGET).reduce((a, b) => a + b, 0)
  console.log(`check-miniapp-design-tokens OK（旧调色板的 #hex 写法已清零，` +
              `但换成 rgb()/%23 的还有 ${dis} 处压着棘轮；` +
              `另有 ${left} 处写死色值，都按页收）`)
}

main()
