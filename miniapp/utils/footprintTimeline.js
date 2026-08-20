// utils/footprintTimeline.js — 学习足迹按日期分组时间轴

const TARGET_TYPE_LABELS = {
  news: '动态',
  hall: '展馆',
  craft: '文创',
  course: '课程',
  resource: '资源',
  activity: '活动'
}

function parseDateKey(createdAt) {
  const s = createdAt != null ? String(createdAt).trim() : ''
  if (s.length >= 10) return s.slice(0, 10)
  return s
}

function formatDateLabel(dateKey, now = new Date()) {
  if (!dateKey) return '未知日期'
  const parts = dateKey.split('-').map(Number)
  if (parts.length < 3 || parts.some(n => !Number.isFinite(n))) return dateKey

  const target = new Date(parts[0], parts[1] - 1, parts[2])
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((today - target) / 86400000)

  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (parts[0] === now.getFullYear()) {
    return `${parts[1]}月${parts[2]}日`
  }
  return `${parts[0]}年${parts[1]}月${parts[2]}日`
}

function formatTimeOfDay(createdAt) {
  const s = createdAt != null ? String(createdAt).trim() : ''
  const space = s.indexOf(' ')
  return space > 0 ? s.slice(space + 1) : s
}

function targetTypeLabel(type) {
  if (!type) return ''
  return TARGET_TYPE_LABELS[type] || type
}

function normalizeFootprintItem(raw, index) {
  const createdAt = raw.createdAt || ''
  const targetType = raw.targetType || ''
  const typeLabel = raw.targetTypeLabel || targetTypeLabel(targetType)
  const eventLabel = raw.eventLabel || raw.eventType || ''
  return {
    id: raw.id != null
      ? String(raw.id)
      : `${targetType}-${raw.targetId || 0}-${createdAt}-${raw.eventType || ''}-${index}`,
    title: raw.title || '未命名内容',
    eventLabel,
    targetType,
    targetTypeLabel: typeLabel,
    subtitle: [eventLabel, typeLabel].filter(Boolean).join(' · '),
    createdAt,
    timeLabel: formatTimeOfDay(createdAt),
    route: raw.route || ''
  }
}

function groupFootprintsByDate(items, now = new Date()) {
  const groups = new Map()
  ;(items || []).forEach((raw, index) => {
    const item = normalizeFootprintItem(raw, index)
    const dateKey = parseDateKey(item.createdAt)
    if (!groups.has(dateKey)) {
      groups.set(dateKey, {
        dateKey,
        dateLabel: formatDateLabel(dateKey, now),
        items: []
      })
    }
    groups.get(dateKey).items.push(item)
  })
  return Array.from(groups.values()).sort((a, b) => b.dateKey.localeCompare(a.dateKey))
}

module.exports = {
  TARGET_TYPE_LABELS,
  parseDateKey,
  formatDateLabel,
  formatTimeOfDay,
  targetTypeLabel,
  normalizeFootprintItem,
  groupFootprintsByDate
}
