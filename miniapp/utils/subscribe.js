// utils/subscribe.js — 微信订阅消息授权（活动报名等）

const { get, post } = require('./request')

/**
 * 报名前请求订阅授权并上报后端
 * @param {string} scene 如 enroll_success
 * @param {string} templateKey templates 接口字段，如 enrollSuccess
 */
function requestSubscribe(scene, templateKey) {
  return new Promise(async (resolve) => {
    if (!wx.requestSubscribeMessage) {
      resolve()
      return
    }
    try {
      const templates = await get('/subscribe/templates').catch(() => ({}))
      const tmplId = templates && templates[templateKey]
      if (!tmplId) {
        resolve()
        return
      }
      wx.requestSubscribeMessage({
        tmplIds: [tmplId],
        success(res) {
          const accepted = res[tmplId] === 'accept'
          if (accepted) {
            post('/subscribe/records', {
              scene,
              templateId: tmplId,
              accepted: true
            }).catch(() => {})
          }
          resolve()
        },
        fail() { resolve() }
      })
    } catch (e) {
      resolve()
    }
  })
}

module.exports = { requestSubscribe }
