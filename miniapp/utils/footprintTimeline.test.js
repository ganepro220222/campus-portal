/**
 * 学习足迹时间轴单测
 * 运行：node miniapp/utils/footprintTimeline.test.js
 */
const assert = require('assert')
const {
  formatDateLabel,
  formatTimeOfDay,
  groupFootprintsByDate,
  normalizeFootprintItem
} = require('./footprintTimeline')

const now = new Date(2026, 7, 20, 15, 0, 0)

assert.strictEqual(formatDateLabel('2026-08-20', now), '今天')
assert.strictEqual(formatDateLabel('2026-08-19', now), '昨天')
assert.strictEqual(formatDateLabel('2026-08-01', now), '8月1日')
assert.strictEqual(formatDateLabel('2025-12-25', now), '2025年12月25日')

assert.strictEqual(formatTimeOfDay('2026-08-20 14:30'), '14:30')

const item = normalizeFootprintItem({
  eventType: 'view',
  eventLabel: '浏览',
  targetType: 'news',
  targetId: 9,
  title: '测试动态',
  createdAt: '2026-08-20 09:15',
  route: '/packageA/news/detail?id=9'
}, 0)
assert.strictEqual(item.subtitle, '浏览 · 动态')
assert.strictEqual(item.timeLabel, '09:15')

const groups = groupFootprintsByDate([
  { title: 'A', targetType: 'news', targetId: 1, eventLabel: '浏览', createdAt: '2026-08-20 10:00' },
  { title: 'B', targetType: 'course', targetId: 2, eventLabel: '学习', createdAt: '2026-08-20 08:00' },
  { title: 'C', targetType: 'hall', targetId: 3, eventLabel: '浏览', createdAt: '2026-08-19 18:00' }
], now)

assert.strictEqual(groups.length, 2)
assert.strictEqual(groups[0].dateLabel, '今天')
assert.strictEqual(groups[0].items.length, 2)
assert.strictEqual(groups[1].dateLabel, '昨天')
assert.strictEqual(groups[1].items[0].title, 'C')

console.log('[footprintTimeline.test] PASS')
