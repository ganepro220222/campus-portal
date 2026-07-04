// utils/format.js — 通用格式化工具

/*
 * 日期格式化
 * 参数 input  时间字符串、时间戳或 Date 对象
 * 参数 fmt    格式模板，支持 'YYYY-MM-DD' 'YYYY-MM-DD HH:mm' 'MM-DD HH:mm'
 */
const formatDate = (input, fmt = 'YYYY-MM-DD') => {
  if (!input) return ''
  const d = new Date(input)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return fmt
    .replace('YYYY', d.getFullYear())
    .replace('MM',   pad(d.getMonth() + 1))
    .replace('DD',   pad(d.getDate()))
    .replace('HH',   pad(d.getHours()))
    .replace('mm',   pad(d.getMinutes()))
}

// 相对时间描述（刚刚、X分钟前…超过30天显示日期）
const timeAgo = (input) => {
  if (!input) return ''
  const diff = Date.now() - new Date(input).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 1)   return '刚刚'
  if (min < 60)  return `${min}分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}小时前`
  const day  = Math.floor(hour / 24)
  if (day < 30)  return `${day}天前`
  return formatDate(input, 'MM-DD')
}

// 文件大小格式化（单位 KB 输入，自动升级为 MB）
const formatSize = (kb) => {
  if (!kb && kb !== 0) return ''
  if (kb < 1024) return `${kb} KB`
  return `${(kb / 1024).toFixed(1)} MB`
}

// 时长格式化：秒数 → mm:ss 或 HH:mm:ss
const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const pad = n => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

// 数字缩写（10000 → 1w，1200 → 1.2k）
const formatCount = (n) => {
  if (!n && n !== 0) return '0'
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  if (n >= 1000)  return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// 手机号脱敏（138****8888）
const maskPhone = (phone) => {
  if (!phone || phone.length < 7) return phone
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

module.exports = { formatDate, timeAgo, formatSize, formatDuration, formatCount, maskPhone }
