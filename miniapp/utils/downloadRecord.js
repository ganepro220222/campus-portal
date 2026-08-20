// utils/downloadRecord.js — 个人中心下载记录映射

function canRedownload(raw) {
  const resourceId = raw && raw.resourceId
  const fileType = raw && raw.fileType != null ? String(raw.fileType).trim() : ''
  return resourceId != null && resourceId !== '' && fileType !== ''
}

function mapDownloadRecordItem(raw) {
  if (!raw) return null
  const fileType = raw.fileType != null ? String(raw.fileType).trim() : ''
  const available = canRedownload(raw)
  return {
    id: raw.id,
    resourceId: raw.resourceId != null ? String(raw.resourceId) : '',
    title: raw.fileName || '未命名文件',
    subtitle: available ? fileType.toUpperCase() : '资源已下架',
    downloadedAt: raw.downloadedAt || '',
    fileType,
    canRedownload: available,
    statusLabel: available ? '' : '已失效',
    statusClass: available ? '' : 'rejected'
  }
}

module.exports = {
  canRedownload,
  mapDownloadRecordItem
}
