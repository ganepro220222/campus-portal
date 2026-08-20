// utils/favoriteToggle.js — 全模块收藏切换

const { post } = require('./request')

function mapCollectedFromDetail(api) {
  const collected = !!(api && api.collected)
  return {
    collected,
    collectLabel: collected ? '已收藏' : '收藏'
  }
}

function applyCollectedToggle(prev, res) {
  const collected = res && res.collected != null ? !!res.collected : !prev.collected
  const patch = {
    collected,
    collectLabel: collected ? '已收藏' : '收藏'
  }
  if (res && res.favoriteCount != null && prev.favoriteCount != null) {
    patch.favoriteCount = res.favoriteCount
  }
  return patch
}

function toggleFavorite(targetType, targetId) {
  return post('/favorites/toggle', {
    targetType,
    targetId: Number(targetId)
  })
}

function applyListCollected(items) {
  return (items || []).map(it => ({
    ...it,
    collected: !!it.collected,
    collectLabel: it.collected ? '已收藏' : '收藏'
  }))
}

function patchListItemCollected(list, id, collected) {
  const key = String(id)
  return (list || []).map(it => {
    if (String(it.id) !== key) return it
    return {
      ...it,
      collected,
      collectLabel: collected ? '已收藏' : '收藏'
    }
  })
}

module.exports = {
  mapCollectedFromDetail,
  applyCollectedToggle,
  toggleFavorite,
  applyListCollected,
  patchListItemCollected
}
