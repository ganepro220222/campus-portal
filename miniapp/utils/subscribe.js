// utils/subscribe.js — 微信订阅消息授权（活动报名等）

const { get, post } = require('./request')

const ENROLL_SUCCESS_SUBSCRIPTION = {
  scene: 'enroll_success',
  templateKey: 'enrollSuccess'
}
const ENROLL_APPROVED_SUBSCRIPTION = {
  scene: 'enroll_approved',
  templateKey: 'enrollApproved'
}

function buildEnrollSubscribeRequests(needReview) {
  const requests = [ENROLL_SUCCESS_SUBSCRIPTION]
  if (needReview) {
    requests.push(ENROLL_APPROVED_SUBSCRIPTION)
  }
  return requests.map((item) => ({ ...item }))
}

function resolveTemplateRequests(requests, templates) {
  return (Array.isArray(requests) ? requests : [])
    .map((item) => ({
      scene: String((item && item.scene) || '').trim(),
      templateKey: String((item && item.templateKey) || '').trim(),
      templateId: String((templates && templates[item && item.templateKey]) || '').trim()
    }))
    .filter((item) => item.scene && item.templateKey && item.templateId)
}

function requestWxSubscriptions(templateIds) {
  return new Promise((resolve) => {
    wx.requestSubscribeMessage({
      tmplIds: Array.from(new Set(templateIds)),
      success: resolve,
      fail(error) {
        console.warn('[subscribe] 微信订阅授权请求失败', error)
        resolve({})
      }
    })
  })
}

async function recordAcceptedSubscriptions(entries) {
  const results = await Promise.all(entries.map(async (item) => {
    try {
      await post('/subscribe/records', {
        scene: item.scene,
        templateId: item.templateId,
        accepted: true
      }, { silent: true })
      return { scene: item.scene, recorded: true }
    } catch (error) {
      console.warn('[subscribe] 授权记录写入失败', item.scene, error)
      return { scene: item.scene, recorded: false }
    }
  }))
  return results
}

/**
 * 一次请求一组订阅模板，并等待所有已接受授权写入后端后再返回。
 * 写入失败不会阻断报名，但会留下明确日志；站内消息仍是最终兜底。
 */
async function requestSubscribeMany(requests) {
  const empty = { requested: [], accepted: [], recorded: [], recordFailures: [] }
  if (!wx.requestSubscribeMessage) {
    return empty
  }
  try {
    const templates = await get('/subscribe/templates', {}, { silent: true }).catch((error) => {
      console.warn('[subscribe] 获取订阅模板失败', error)
      return {}
    })
    const entries = resolveTemplateRequests(requests, templates)
    if (!entries.length) {
      return empty
    }
    const response = await requestWxSubscriptions(entries.map((item) => item.templateId))
    const accepted = entries.filter((item) => response[item.templateId] === 'accept')
    const recorded = await recordAcceptedSubscriptions(accepted)
    return {
      requested: entries.map((item) => item.scene),
      accepted: accepted.map((item) => item.scene),
      recorded: recorded.filter((item) => item.recorded).map((item) => item.scene),
      recordFailures: recorded.filter((item) => !item.recorded).map((item) => item.scene)
    }
  } catch (error) {
    console.warn('[subscribe] 订阅授权流程失败', error)
    return empty
  }
}

/** 兼容单模板调用。 */
function requestSubscribe(scene, templateKey) {
  return requestSubscribeMany([{ scene, templateKey }])
}

module.exports = {
  requestSubscribe,
  requestSubscribeMany,
  buildEnrollSubscribeRequests,
  resolveTemplateRequests
}
