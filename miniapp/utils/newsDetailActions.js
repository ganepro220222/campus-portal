// utils/newsDetailActions.js — 动态详情点赞/收藏：仅成功时更新页面

const { applyLikeToggle, applyFavoriteToggle } = require('./newsInteraction')

function mergeLikeSuccess(prev, res) {
  return applyLikeToggle(prev, res)
}

function mergeFavoriteSuccess(prev, res) {
  return applyFavoriteToggle(prev, res)
}

function likeSuccessToast(patch) {
  return patch.liked ? '点赞成功' : ''
}

function favoriteSuccessToast(patch) {
  return patch.collected ? '收藏成功' : ''
}

module.exports = {
  mergeLikeSuccess,
  mergeFavoriteSuccess,
  likeSuccessToast,
  favoriteSuccessToast
}
