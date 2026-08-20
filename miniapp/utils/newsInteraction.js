// utils/newsInteraction.js — 动态详情点赞/收藏态与数量
const { formatCount } = require('./format')

function normalizeCount(n) {
  const num = Number(n)
  return Number.isFinite(num) && num >= 0 ? Math.floor(num) : 0
}

function buildLikeLabel(liked, likeCount) {
  const base = liked ? '已赞' : '点赞'
  const count = normalizeCount(likeCount)
  return count > 0 ? `${base} ${formatCount(count)}` : base
}

function buildCollectLabel(collected, favoriteCount) {
  const base = collected ? '已收藏' : '收藏'
  const count = normalizeCount(favoriteCount)
  return count > 0 ? `${base} ${formatCount(count)}` : base
}

function mapDetailInteraction(api) {
  const liked = !!(api && api.liked)
  const collected = !!(api && api.collected)
  const likeCount = normalizeCount(api && api.likeCount)
  const favoriteCount = normalizeCount(api && api.favoriteCount)
  return {
    liked,
    collected,
    likeCount,
    favoriteCount,
    likeLabel: buildLikeLabel(liked, likeCount),
    collectLabel: buildCollectLabel(collected, favoriteCount)
  }
}

function applyLikeToggle(prev, res) {
  const liked = res && res.liked != null ? !!res.liked : !prev.liked
  const likeCount = res && res.likeCount != null
    ? normalizeCount(res.likeCount)
    : normalizeCount(prev.likeCount)
  return {
    liked,
    likeCount,
    likeLabel: buildLikeLabel(liked, likeCount)
  }
}

function applyFavoriteToggle(prev, res) {
  const collected = res && res.collected != null ? !!res.collected : !prev.collected
  const favoriteCount = res && res.favoriteCount != null
    ? normalizeCount(res.favoriteCount)
    : normalizeCount(prev.favoriteCount)
  return {
    collected,
    favoriteCount,
    collectLabel: buildCollectLabel(collected, favoriteCount)
  }
}

module.exports = {
  normalizeCount,
  buildLikeLabel,
  buildCollectLabel,
  mapDetailInteraction,
  applyLikeToggle,
  applyFavoriteToggle
}
