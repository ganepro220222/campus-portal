// utils/newsShare.js — 动态详情分享参数（好友 / 朋友圈）

function buildNewsShareAppMessage(article, articleId) {
  const id = articleId != null ? articleId : (article && article.id)
  const title = (article && article.title) ? String(article.title) : '书院动态'
  const path = id ? `/packageA/news/detail?id=${id}` : '/pages/news/index'
  const msg = { title, path }
  const cover = article && article.cover
  if (cover) msg.imageUrl = String(cover)
  return msg
}

function buildNewsShareTimeline(article, articleId) {
  const id = articleId != null ? articleId : (article && article.id)
  const title = (article && article.title) ? String(article.title) : '书院动态'
  return {
    title,
    query: id ? `id=${id}` : ''
  }
}

module.exports = { buildNewsShareAppMessage, buildNewsShareTimeline }
