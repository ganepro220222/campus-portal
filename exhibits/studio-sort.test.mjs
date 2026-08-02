import assert from 'node:assert/strict'
import {
  naturalKey, compareNatural, completeness, envKey, envLabel, panoramaUrlKey, PANORAMA_LABEL_NAME_MAX,
  dataUriEnvKey, clearEnvKeyCache, ENV_PRESET_LABELS,
  SORTS, SORT_IDS, DEFAULT_SORT, sortSpec, defaultDesc, sortItems,
  FILTERS, FILTER_IDS, filterSpec, searchKey, filterItems, filterCounts,
  viewItems, normalizeView,
} from './studio-sort.mjs'
import { ENV_PRESET_KEYS } from './light-rig.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}
const dirs = list => list.map(i => i.dir)

console.log('studio-sort tests')

/* ---------- 自然序 ---------- */

test('自然序：craft-2 排在 craft-10 之前（字典序会反过来）', () => {
  assert.ok(compareNatural('craft-2', 'craft-10') < 0)
  assert.ok('craft-2' > 'craft-10')            // 这就是不能直接用字典序的原因
})

test('自然序：补零与不补零的编号等价', () => {
  assert.equal(compareNatural('craft-007', 'craft-7'), 0)
  assert.ok(compareNatural('craft-007', 'craft-8') < 0)
})

test('自然序：13/14 位编号按数值排序（不能退化成字典序）', () => {
  assert.ok(compareNatural('craft-9999999999999', 'craft-10000000000000') < 0)
  assert.ok(compareNatural('craft-10000000000000', 'craft-9999999999999') > 0)
})

test('自然序：32 位编号边界同样按数值排序', () => {
  const low = 'craft-9999999999999999999999999999999'
  const high = 'craft-10000000000000000000000000000000'
  assert.ok(compareNatural(low, high) < 0)
  assert.ok(compareNatural(high, low) > 0)
})

test('naturalKey 容忍 null / undefined / 数字', () => {
  assert.equal(naturalKey(null), '')
  assert.equal(naturalKey(undefined), '')
  assert.equal(naturalKey(12), '0212')
})

/* ---------- 完成度 ---------- */

const full = { dir: 'craft-001', title: '甲', hasModel: true, poster: 'craft-001/assets/poster.jpg', hotspots: 3, hasPano: true }

test('完成度：齐全的展品满分且无缺项', () => {
  const r = completeness(full)
  assert.equal(r.score, 100)
  assert.deepEqual(r.missing, [])
})

test('完成度：缺得越致命分越低（配置错 < 缺模型 < 缺封面 < 无热点 < 无全景）', () => {
  const s = it => completeness({ ...full, ...it }).score
  const err = s({ error: 'bad json' })
  const noModel = s({ hasModel: false })
  const noPoster = s({ poster: '' })
  const noHot = s({ hotspots: 0 })
  const noPano = s({ hasPano: false })
  assert.ok(err < noModel && noModel < noPoster && noPoster < noHot && noHot < noPano && noPano < 100)
})

test('完成度：hasModel 未知（字段缺失）不算缺模型', () => {
  const r = completeness({ ...full, hasModel: undefined })
  assert.ok(!r.missing.includes('缺模型'))
  assert.equal(r.score, 100)
})

test('完成度：缺项文案齐全', () => {
  const r = completeness({ dir: 'craft-009', error: 'x' })
  assert.deepEqual(r.missing, ['配置读不出', '缺封面', '无热点', '无全景'])
})

/* ---------- 背景环境（分组） ---------- */

test('环境预设标签与 light-rig 的预设键完全一致', () => {
  assert.deepEqual(Object.keys(ENV_PRESET_LABELS).sort(), [...ENV_PRESET_KEYS].sort())
})

test('envKey：相同远程 URL 归为一组', () => {
  const url = 'https://cdn.example.com/bg/sunset.jpg'
  const a = { dir: 'craft-001', hasPano: true, panorama: url }
  const b = { dir: 'craft-002', hasPano: true, panorama: url }
  assert.equal(envKey(a), envKey(b))
})

test('envKey：不同展品同 basename 的相对路径不应合并', () => {
  const a = { dir: 'craft-001', hasPano: true, panorama: 'assets/panorama.jpg' }
  const b = { dir: 'craft-002', hasPano: true, panorama: 'assets/panorama.jpg' }
  assert.notEqual(envKey(a), envKey(b))
})

test('envKey：panoramaHash 优先于路径', () => {
  const a = { dir: 'craft-001', hasPano: true, panorama: 'assets/a.jpg', panoramaHash: 'abc123' }
  const b = { dir: 'craft-002', hasPano: true, panorama: 'assets/b.jpg', panoramaHash: 'abc123' }
  assert.equal(envKey(a), envKey(b))
})

test('envKey：scheme 与 hostname 大小写不同视为同一远程 URL', () => {
  const a = { dir: 'craft-001', hasPano: true, panorama: 'HTTPS://CDN.EXAMPLE.COM/bg/sunset.jpg' }
  const b = { dir: 'craft-002', hasPano: true, panorama: 'https://cdn.example.com/bg/sunset.jpg' }
  assert.equal(envKey(a), envKey(b))
})

test('envKey：path 大小写不同不得合并', () => {
  const a = { dir: 'craft-001', hasPano: true, panorama: 'https://cdn.example.com/A.jpg' }
  const b = { dir: 'craft-002', hasPano: true, panorama: 'https://cdn.example.com/a.jpg' }
  assert.notEqual(envKey(a), envKey(b))
})

test('envKey：query 大小写不同不得合并', () => {
  const a = { dir: 'craft-001', hasPano: true, panorama: 'https://cdn.example.com/x.jpg?token=ABC' }
  const b = { dir: 'craft-002', hasPano: true, panorama: 'https://cdn.example.com/x.jpg?token=abc' }
  assert.notEqual(envKey(a), envKey(b))
})

test('envKey：protocol-relative URL 仅规范化 hostname', () => {
  const a = { dir: 'craft-001', hasPano: true, panorama: '//CDN.EXAMPLE.COM/x.jpg' }
  const b = { dir: 'craft-002', hasPano: true, panorama: '//cdn.example.com/x.jpg' }
  assert.equal(envKey(a), envKey(b))
  const c = { dir: 'craft-003', hasPano: true, panorama: '//cdn.example.com/X.jpg' }
  assert.notEqual(envKey(a), envKey(c))
})

test('panoramaUrlKey：data/blob 不做整条小写化', () => {
  const data = 'data:image/png;base64,AbC'
  assert.equal(panoramaUrlKey(data), data)
})

test('envKey：根相对 path 大小写不同不得合并', () => {
  const a = { dir: 'craft-001', hasPano: true, panorama: '/shared/A.jpg' }
  const b = { dir: 'craft-002', hasPano: true, panorama: '/shared/a.jpg' }
  assert.notEqual(envKey(a), envKey(b))
})

test('envKey：不同文件名不归为一组', () => {
  const a = { dir: 'craft-001', hasPano: true, panorama: 'assets/sunset.jpg' }
  const b = { dir: 'craft-002', hasPano: true, panorama: 'assets/dawn.jpg' }
  assert.notEqual(envKey(a), envKey(b))
})

test('envKey：配了 panorama 但文件不存在时不算全景，退回预设', () => {
  const it = { dir: 'craft-004', hasPano: false, panorama: 'assets/missing.jpg', envPreset: 'gallery' }
  assert.equal(envKey(it), 'preset:gallery')
  assert.equal(envLabel(it), '博物馆暖阁')
})

test('envKey：未知 / 缺失预设回落到 room', () => {
  assert.equal(envKey({ dir: 'a' }), 'preset:room')
  assert.equal(envKey({ dir: 'a', envPreset: 'nonsense' }), 'preset:room')
  assert.equal(envLabel({ dir: 'a', envPreset: 'nonsense' }), '内置房间')
})

test('envLabel：全景显示文件名，不显示整条路径', () => {
  assert.equal(envLabel({ hasPano: true, panorama: 'assets/pano/sunset.jpg' }), '全景 · sunset.jpg')
  assert.equal(envLabel({ hasPano: true, panorama: 'C:\\pano\\sunset.jpg' }), '全景 · sunset.jpg')
})

test('envLabel：远程 / 根相对 / hash 全景不误显示为内置房间', () => {
  assert.equal(
    envLabel({ hasPano: true, panorama: 'https://cdn.example.com/bg/sunset.jpg' }),
    '全景 · sunset.jpg',
  )
  assert.equal(
    envLabel({ hasPano: true, panorama: '//cdn.example.com/bg/sunset.jpg' }),
    '全景 · sunset.jpg',
  )
  assert.equal(envLabel({ hasPano: true, panorama: '/shared/bg.jpg' }), '全景 · bg.jpg')
  assert.equal(envLabel({ hasPano: true, panorama: 'data:image/png;base64,AbC' }), '全景 · 内嵌图片')
  assert.equal(envLabel({ hasPano: true, panorama: 'blob:https://example.com/u' }), '全景 · 临时图片')
  assert.equal(
    envLabel({ hasPano: true, panorama: 'blob:https://example.com/u', panoramaHash: 'abc123' }),
    '全景 · 临时图片',
  )
})

test('envLabel：data URI 不泄漏 Base64，且 label 有长度上限', () => {
  const big = 'data:image/jpeg;base64,' + 'A'.repeat(1_000_000)
  const item = { hasPano: true, panorama: big }
  const label = envLabel(item)
  assert.equal(label, '全景 · 内嵌图片')
  assert.ok(label.length < 32)
  assert.ok(!label.includes('AAAA'))
  assert.ok(!searchKey({ dir: 'c', title: 't', ...item }).includes('aaaa'))
})

test('envKey：data URI 使用紧凑 identity，不含 Base64 主体', () => {
  clearEnvKeyCache()
  const big = 'data:image/jpeg;base64,' + 'A'.repeat(1_000_000)
  const item = { hasPano: true, panorama: big }
  const key = envKey(item)
  assert.ok(key.length < 256, `key 过长：${key.length}`)
  assert.ok(key.startsWith('pano-data:image/jpeg:'))
  assert.ok(!key.includes('AAAA'))
  assert.equal(envKey(item), key, '同一 URI 应命中缓存')
  const other = { hasPano: true, panorama: 'data:image/jpeg;base64,' + 'B'.repeat(100) }
  assert.notEqual(envKey(item), envKey(other))
})

test('sortItems：大量 data URI 环境排序在合理时间内完成', () => {
  clearEnvKeyCache()
  const items = Array.from({ length: 100 }, (_, i) => ({
    dir: `craft-${String(i).padStart(3, '0')}`,
    hasPano: true,
    panorama: 'data:image/jpeg;base64,' + 'A'.repeat(50_000 + i),
  }))
  const t0 = performance.now()
  sortItems(items, 'env')
  const ms = performance.now() - t0
  assert.ok(ms < 3000, `环境排序过慢：${ms.toFixed(0)}ms`)
})

test('envLabel：签名 URL 只显示 pathname basename，不含 query/fragment', () => {
  const signed = 'https://cdn.example.com/bg/pano.jpg?X-Amz-Credential=PUBLIC&X-Amz-Signature=TOPSECRET#view'
  assert.equal(envLabel({ hasPano: true, panorama: signed }), '全景 · pano.jpg')
  const sk = searchKey({ dir: 'c', title: 't', hasPano: true, panorama: signed })
  assert.ok(!sk.includes('topsecret'))
  assert.ok(!sk.includes('credential'))
})

test('envLabel：HTTP URL 无 basename 时使用远程图片', () => {
  assert.equal(envLabel({ hasPano: true, panorama: 'https://cdn.example.com/' }), '全景 · 远程图片')
})

test('envLabel：过长 basename 截断', () => {
  const long = 'x'.repeat(PANORAMA_LABEL_NAME_MAX + 50) + '.jpg'
  const label = envLabel({ hasPano: true, panorama: 'assets/' + long })
  assert.ok(label.endsWith('…'))
  assert.ok(label.length <= '全景 · '.length + PANORAMA_LABEL_NAME_MAX + 1)
})

test('searchKey：远程与根相对全景可被「全景」搜到', () => {
  const remote = { dir: 'craft-1', title: '甲', hasPano: true, panorama: 'https://cdn/x.jpg' }
  const root = { dir: 'craft-2', title: '乙', hasPano: true, panorama: '/shared/x.jpg' }
  assert.ok(searchKey(remote).includes('全景'))
  assert.ok(searchKey(root).includes('全景'))
})

test('envLabel：读不出配置的展品不编造环境', () => {
  assert.equal(envLabel({ dir: 'craft-x', error: 'boom' }), '')
})

test('按背景环境排序时，同背景的展品一定相邻', () => {
  const shared = 'https://cdn.example.com/shared/sunset.jpg'
  const items = [
    { dir: 'craft-001', hasPano: true, panorama: shared },
    { dir: 'craft-002', envPreset: 'gallery' },
    { dir: 'craft-003', hasPano: true, panorama: shared },
    { dir: 'craft-004', envPreset: 'gallery' },
  ]
  const keys = sortItems(items, 'env').map(envKey)
  const firstIdx = new Map(), lastIdx = new Map()
  keys.forEach((k, i) => { if (!firstIdx.has(k)) firstIdx.set(k, i); lastIdx.set(k, i) })
  for (const [k, first] of firstIdx) {
    const span = lastIdx.get(k) - first + 1
    assert.equal(span, keys.filter(x => x === k).length, `${k} 被打断了`)
  }
})

/* ---------- 排序 ---------- */

test('默认排序是目录序号，且每个排序 id 唯一', () => {
  assert.equal(DEFAULT_SORT, 'dir')
  assert.equal(new Set(SORT_IDS).size, SORT_IDS.length)
  assert.ok(SORT_IDS.includes(DEFAULT_SORT))
})

test('未知排序 id 回落到默认，不抛错', () => {
  assert.equal(sortSpec('nope').id, DEFAULT_SORT)
  assert.equal(defaultDesc('nope'), false)
})

test('时间 / 数量类默认降序，其它默认升序', () => {
  assert.equal(defaultDesc('mtime'), true)
  assert.equal(defaultDesc('hotspots'), true)
  assert.equal(defaultDesc('dir'), false)
  assert.equal(defaultDesc('title'), false)
  assert.equal(defaultDesc('env'), false)
})

test('按目录序号排序走自然序', () => {
  const items = [{ dir: 'craft-10' }, { dir: 'craft-2' }, { dir: 'craft-1' }]
  assert.deepEqual(dirs(sortItems(items, 'dir')), ['craft-1', 'craft-2', 'craft-10'])
})

test('desc 翻转顺序，但不破坏末级稳定性', () => {
  const items = [{ dir: 'craft-1' }, { dir: 'craft-2' }, { dir: 'craft-3' }]
  assert.deepEqual(dirs(sortItems(items, 'dir', true)), ['craft-3', 'craft-2', 'craft-1'])
})

test('按最后编辑时间排序；缺 mtime 当 0', () => {
  const items = [
    { dir: 'craft-1', mtime: 100 },
    { dir: 'craft-2' },
    { dir: 'craft-3', mtime: 300 },
  ]
  assert.deepEqual(dirs(sortItems(items, 'mtime', true)), ['craft-3', 'craft-1', 'craft-2'])
})

test('按名称排序用中文语序，数字按大小而非字符', () => {
  const items = [{ dir: 'a', title: '第10号' }, { dir: 'b', title: '第2号' }]
  assert.deepEqual(dirs(sortItems(items, 'title')), ['b', 'a'])
})

test('待完善优先：缺得最多的排最前', () => {
  const items = [
    { ...full, dir: 'craft-1' },
    { dir: 'craft-2', hasModel: false, poster: '', hotspots: 0, hasPano: false },
    { dir: 'craft-3', hasModel: true, poster: 'p.jpg', hotspots: 0, hasPano: true },
  ]
  assert.deepEqual(dirs(sortItems(items, 'todo')), ['craft-2', 'craft-3', 'craft-1'])
})

test('同分项按目录序号稳定收尾（同一输入的不同排列结果一致）', () => {
  const mk = d => ({ dir: d, hotspots: 5 })
  const a = sortItems([mk('craft-3'), mk('craft-1'), mk('craft-2')], 'hotspots')
  const b = sortItems([mk('craft-2'), mk('craft-3'), mk('craft-1')], 'hotspots')
  assert.deepEqual(dirs(a), dirs(b))
  assert.deepEqual(dirs(a), ['craft-1', 'craft-2', 'craft-3'])
})

test('sortItems 不修改入参数组', () => {
  const items = [{ dir: 'craft-9' }, { dir: 'craft-1' }]
  const before = dirs(items)
  sortItems(items, 'dir')
  assert.deepEqual(dirs(items), before)
})

test('sortItems 容忍空输入', () => {
  assert.deepEqual(sortItems(), [])
  assert.deepEqual(sortItems(null, 'mtime'), [])
})

/* ---------- 筛选 ---------- */

const sample = [
  { ...full, dir: 'craft-001', title: '青瓷瓶' },
  { dir: 'craft-002', title: '木雕', hasModel: false, poster: '', hotspots: 0, hasPano: false },
  { dir: 'craft-003', title: '银饰', hasModel: true, poster: 'craft-003/assets/poster.jpg', hotspots: 2, hasPano: false },
  { dir: 'craft-004', title: '坏配置', error: 'Unexpected token' },
]

test('筛选 id 唯一且含默认「全部」', () => {
  assert.equal(new Set(FILTER_IDS).size, FILTER_IDS.length)
  assert.equal(FILTERS[0].id, 'all')
  assert.equal(filterSpec('nope').id, 'all')
})

test('全部 = 不过滤', () => {
  assert.equal(filterItems(sample, 'all').length, 4)
})

test('待完善命中所有有缺口的展品', () => {
  assert.deepEqual(dirs(filterItems(sample, 'todo')), ['craft-002', 'craft-003', 'craft-004'])
})

test('缺模型包含配置读不出的（同样进不去编辑器）', () => {
  assert.deepEqual(dirs(filterItems(sample, 'nomodel')), ['craft-002', 'craft-004'])
})

test('缺封面 / 无全景各自命中', () => {
  assert.deepEqual(dirs(filterItems(sample, 'noposter')), ['craft-002', 'craft-004'])
  assert.deepEqual(dirs(filterItems(sample, 'nopano')), ['craft-002', 'craft-003', 'craft-004'])
})

test('搜索匹配名称 / 目录 / 副标题，大小写不敏感', () => {
  assert.deepEqual(dirs(filterItems(sample, 'all', '青瓷')), ['craft-001'])
  assert.deepEqual(dirs(filterItems(sample, 'all', 'CRAFT-003')), ['craft-003'])
  assert.deepEqual(dirs(filterItems([{ dir: 'craft-9', title: 'x', subtitle: '非遗工艺' }], 'all', '非遗')), ['craft-9'])
})

test('搜索也能搜到背景环境（如「全景」「暖阁」）', () => {
  const items = [
    { dir: 'craft-1', title: '甲', hasPano: true, panorama: 'assets/sunset.jpg' },
    { dir: 'craft-2', title: '乙', envPreset: 'gallery' },
  ]
  assert.deepEqual(dirs(filterItems(items, 'all', 'sunset')), ['craft-1'])
  assert.deepEqual(dirs(filterItems(items, 'all', '暖阁')), ['craft-2'])
})

test('搜索与筛选叠加生效', () => {
  assert.deepEqual(dirs(filterItems(sample, 'nopano', '银饰')), ['craft-003'])
  assert.deepEqual(dirs(filterItems(sample, 'nomodel', '银饰')), [])
})

test('空白搜索词不过滤', () => {
  assert.equal(filterItems(sample, 'all', '   ').length, 4)
})

test('searchKey 不因缺字段炸掉', () => {
  assert.equal(typeof searchKey(), 'string')
  assert.equal(typeof searchKey({}), 'string')
})

test('筛选计数与实际筛选结果一致', () => {
  const counts = filterCounts(sample)
  for (const f of FILTERS) assert.equal(counts[f.id], filterItems(sample, f.id).length, f.id)
  assert.equal(counts.all, 4)
})

test('filterCounts 不受搜索词影响（徽标显示总量）', () => {
  assert.deepEqual(filterCounts(sample), filterCounts([...sample]))
  assert.equal(filterCounts([]).todo, 0)
})

/* ---------- 组合与持久化 ---------- */

test('viewItems 先筛后排', () => {
  const out = viewItems(sample, { sort: 'dir', desc: true, filter: 'nopano' })
  assert.deepEqual(dirs(out), ['craft-004', 'craft-003', 'craft-002'])
})

test('viewItems 默认参数等价于「全部 + 目录升序」', () => {
  assert.deepEqual(dirs(viewItems(sample)), dirs(sortItems(sample, 'dir')))
})

test('normalizeView 修正脏值并给出该排序的默认方向', () => {
  assert.deepEqual(normalizeView({ sort: 'zzz', filter: 'zzz' }), { sort: 'dir', desc: false, filter: 'all' })
  assert.deepEqual(normalizeView({ sort: 'mtime' }), { sort: 'mtime', desc: true, filter: 'all' })
  assert.deepEqual(normalizeView(), { sort: 'dir', desc: false, filter: 'all' })
})

test('normalizeView 保留显式的方向选择（含与默认相反的）', () => {
  assert.equal(normalizeView({ sort: 'mtime', desc: false }).desc, false)
  assert.equal(normalizeView({ sort: 'dir', desc: true }).desc, true)
})

console.log('')
if (fail) {
  console.error(`studio-sort: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`studio-sort: ${pass} passed`)
