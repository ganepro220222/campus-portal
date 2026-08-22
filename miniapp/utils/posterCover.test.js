/**
 * 海报封面参数单测
 * 运行：node miniapp/utils/posterCover.test.js
 */
const assert = require('assert')
const {
  parsePosterCover,
  pickHallCover,
  pickCraftCover,
  buildPosterNavigateUrl,
  titleStartY,
  coverRect,
  badgeFitRect,
  greedyWrap,
  balanceLines
} = require('./posterCover')

assert.strictEqual(parsePosterCover(''), '')
assert.strictEqual(parsePosterCover('https://cdn.example.com/a.jpg'), 'https://cdn.example.com/a.jpg')
assert.strictEqual(parsePosterCover(encodeURIComponent('https://cdn.example.com/b.png')),
  'https://cdn.example.com/b.png')
assert.strictEqual(parsePosterCover('/local/path.jpg'), '')

assert.strictEqual(pickHallCover({ slides: [{ imageUrl: 'https://cdn/h.jpg' }] }), 'https://cdn/h.jpg')
assert.strictEqual(pickHallCover({ slides: [] }), '')
assert.strictEqual(pickCraftCover({ images: [{ imageUrl: 'https://cdn/c.jpg' }] }), 'https://cdn/c.jpg')

const url = buildPosterNavigateUrl({
  type: 'hall',
  title: '阳明文化',
  cover: 'https://cdn.example.com/h.jpg'
})
assert.ok(url.includes('type=hall'))
assert.ok(url.includes('title='))
assert.ok(url.includes('cover='))

assert.strictEqual(coverRect(300).w, 220)

/*
 * 标题起始位置不能只钉住一个数字——之前 titleStartY(true) 就是被 assert 成 318 的，
 * 数字对了，画出来副标题却压在二维码上。这里改成核算几何：按 generate.js 里
 * _render 的真实排版复算一遍，断言副标题永远落在二维码白底板上方。
 */
/*
 * 徽记不能被压扁：篆印是 560×499，画成正方形会明显变形。
 * 断言按真实比例 aspectFit，且不超出给定方框。
 */
{
  const SEAL_W = 560, SEAL_H = 499
  const box = 52 * 0.70               // drawBadgePlate 里 size=52 时的可用方框
  const fit = badgeFitRect(SEAL_W, SEAL_H, box)
  assert.ok(Math.abs(fit.w / fit.h - SEAL_W / SEAL_H) < 1e-9,
    `徽记被压扁了：画出来 ${fit.w.toFixed(2)}x${fit.h.toFixed(2)}，原图比例 ${(SEAL_W / SEAL_H).toFixed(3)}`)
  assert.ok(fit.w <= box + 1e-9 && fit.h <= box + 1e-9, '徽记超出方框')
  assert.ok(fit.w > box - 1e-9, '横图应以宽度贴满方框')

  const tall = badgeFitRect(300, 600, 100)          // 竖图走另一分支
  assert.strictEqual(tall.h, 100)
  assert.strictEqual(tall.w, 50)

  // 正方形（原校徽）行为不变，保证这次改动对旧素材无损
  assert.deepStrictEqual(badgeFitRect(480, 480, 100), { w: 100, h: 100 })

  // 拿不到尺寸时退回方形，不能算出 NaN 把画布画坏
  for (const bad of [[0, 0], [undefined, undefined], [NaN, 10]]) {
    assert.deepStrictEqual(badgeFitRect(bad[0], bad[1], 80), { w: 80, h: 80 })
  }
}

const CANVAS = { W: 300, H: 500 }
const QR_SIZE = 64
const QR_PLATE_TOP = (CANVAS.H - 108) - 6      // strokeFillRoundRect(qx-6, qy-6, ...)
const LINE_STEP = 32                            // drawRest 里每行 ty += 32
const SUB_OFFSET = 34                           // 副标题基线 = ty + 34
const SUB_DESCENDER = 3                         // 13px sans-serif 的降部
const MAX_LINES = 3                             // drawRest 里 lines.slice(0, 3)

function subtitleBaseline(hasCover, lineCount) {
  return titleStartY(hasCover) + LINE_STEP * lineCount + SUB_OFFSET
}

for (const hasCover of [false, true]) {
  for (let n = 1; n <= MAX_LINES; n++) {
    const bottom = subtitleBaseline(hasCover, n) + SUB_DESCENDER
    assert.ok(
      bottom <= QR_PLATE_TOP,
      `${hasCover ? '有封面' : '无封面'} ${n} 行标题：副标题底部 ${bottom} 压到二维码白底板（${QR_PLATE_TOP}）`
    )
  }
}

// 有封面时标题不能骑到封面右下角的徽记圆上（圆底部 y=195，22px 字的墨迹顶部 ≈ 基线-22）
const BADGE_BOTTOM = coverRect(CANVAS.W).y + coverRect(CANVAS.W).h - 52 * 0.25 + 26
assert.ok(
  titleStartY(true) - 22 > BADGE_BOTTOM,
  `有封面时标题首行墨迹顶部 ${titleStartY(true) - 22} 压到徽记圆底部 ${BADGE_BOTTOM}`
)

// 无封面沿用既有取值，本轮不动它的观感
assert.strictEqual(titleStartY(false), 250)

/*
 * 标题折行：不能出现「末行只剩一个字」这种排版。
 * 用等宽假测量（每个字符 1 单位）跑，断言与真实字体无关的那部分性质。
 */
{
  const each = (s) => [...String(s)].length          // 每字符宽 1
  const T = '一'.repeat(11)                          // 宽 10 时贪心必定折成 10 + 1

  // 整幅宽度贪心：10 + 1，末行孤字
  const greedy = greedyWrap(T, 10, each)
  assert.deepStrictEqual(greedy.map(l => l.length), [10, 1], '前提变了：贪心不再产生孤字')

  // 均衡后仍是 2 行，但两行长度接近，且末行不止一个字
  const balanced = balanceLines(T, 10, each)
  assert.strictEqual(balanced.length, 2, `均衡后不应改变行数：${JSON.stringify(balanced)}`)
  assert.strictEqual(balanced.join(''), T, '均衡不能吞字或改字')
  assert.ok(balanced[balanced.length - 1].length > 1,
    `末行孤字没修掉：${JSON.stringify(balanced)}`)
  assert.ok(Math.abs(balanced[0].length - balanced[1].length) <= 1,
    `两行长度应接近：${JSON.stringify(balanced)}`)

  // 真实案例：截图里的「贵州交通博物馆 · 教育馆」。CJK 与中点/空格宽度不同，
  // 这里按 CJK 1、其余 0.5 粗略建模，只断言与字体无关的性质。
  {
    const w = (s) => [...String(s)].reduce((n, c) => n + (/[\u4e00-\u9fa5]/.test(c) ? 1 : 0.5), 0)
    const real = '贵州交通博物馆 · 教育馆'
    const g = greedyWrap(real, 8.5, w)
    const bal = balanceLines(real, 8.5, w)
    assert.strictEqual(bal.join(''), real)
    assert.strictEqual(bal.length, g.length, '均衡不应改变行数')
    assert.ok(bal[bal.length - 1].length > 1, `末行孤字：${JSON.stringify(bal)}`)
  }

  // 一行放得下就不折
  assert.deepStrictEqual(balanceLines('云端书院', 10, each), ['云端书院'])

  /*
   * 三行的情形：目标是「最宽的一行尽量窄」，不是「每行一样长」——
   * 25 个字折 3 行的最优解就是 9/9/7，压到 8 会变成 4 行。
   * 所以这里断言：行数不变、最宽行不比贪心更宽、末行不是孤字。
   */
  const long = '一'.repeat(25)
  const g3 = greedyWrap(long, 10, each)
  const b3 = balanceLines(long, 10, each)
  assert.strictEqual(b3.length, g3.length, '均衡不应多出一行')
  assert.strictEqual(b3.join(''), long)
  assert.ok(Math.max(...b3.map(l => l.length)) <= Math.max(...g3.map(l => l.length)),
    `最宽行没变窄：${JSON.stringify(b3)}`)
  assert.ok(b3[b3.length - 1].length > 1, `末行孤字：${JSON.stringify(b3)}`)

  // 超过上限时保持贪心：压窄只会把内容挤进将被截掉的那几行
  const over = '一'.repeat(40)
  assert.deepStrictEqual(balanceLines(over, 10, each, 3), greedyWrap(over, 10, each))

  // 边界：空串、坏参数不能抛
  assert.deepStrictEqual(balanceLines('', 10, each), [''])
  assert.deepStrictEqual(balanceLines('abc', 0, each), ['abc'])
  assert.deepStrictEqual(balanceLines('abc', 10, null), ['abc'])
}

console.log('[posterCover.test] PASS')
