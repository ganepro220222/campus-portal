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
  coverRect
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

console.log('[posterCover.test] PASS')
