/**
 * 通知发送记录的文案表。
 *
 * 页面是给老师看的：接口返回的是 enroll_success / failed / SKIPPED_NO_AUTH 这类
 * 技术标识，这里统一翻译成「这是什么」和「我该做什么」两句人话。
 * 结论一行、处置一行，老师扫一眼就知道下一步，不用去问技术。
 */

export type Tone = 'success' | 'info' | 'warning' | 'danger'

/** 通知类型（对应后端 scene） */
export const SCENE_LABELS: Record<string, string> = {
  enroll_success: '报名成功通知',
  enroll_approved: '报名审核通过通知',
  activity_remind: '活动开始提醒'
}

export function sceneLabel(scene: string): string {
  return SCENE_LABELS[scene] || scene || '—'
}

/** 发送结果（对应后端 status） */
export const STATUS_LABELS: Record<string, { text: string; tone: Tone }> = {
  pending: { text: '待发送', tone: 'info' },
  processing: { text: '发送中', tone: 'warning' },
  sent: { text: '已发送', tone: 'success' },
  // 「跳过」多数不是故障（学生没授权就收不到），标 info 而不是红色，避免老师虚惊
  skipped: { text: '已跳过', tone: 'info' },
  failed: { text: '发送失败', tone: 'danger' }
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status]?.text || status || '—'
}

export function statusTone(status: string): Tone {
  return STATUS_LABELS[status]?.tone || 'info'
}

/** 失败/跳过原因（对应后端 reasonCode）：结论 + 处置指引 */
export const REASON_LABELS: Record<string, { text: string; hint: string }> = {
  SKIPPED_NO_AUTH: {
    text: '学生未授权接收通知',
    hint: '属于正常情况。学生报名时需在弹窗里点「允许」，未允许就收不到这条通知。'
  },
  SKIPPED_NO_OPENID: {
    text: '学生未绑定微信',
    hint: '让学生在小程序里用微信登录一次即可。'
  },
  SKIPPED_NO_TEMPLATE: {
    text: '未配置消息模板',
    hint: '到「内容配置」填写该类通知对应的微信模板 ID 后重新发送。'
  },
  SKIPPED_INVALID_PAYLOAD: {
    text: '活动缺少开始时间',
    hint: '到「活动管理」补填该活动的开始时间，再回来点「重新发送」。'
  },
  WX_REJECTED: {
    text: '微信拒收，多为模板字段不匹配',
    hint: '核对公众平台「我的模板」里的关键词，与系统里配置的字段名保持一致后重新发送。'
  },
  MAX_ATTEMPTS: {
    text: '重试多次仍未成功',
    hint: '多为网络或微信侧临时故障。确认活动信息无误后可点「重新发送」。'
  },
  BAD_PAYLOAD: {
    text: '记录数据损坏',
    hint: '无法自动恢复，请联系技术支持。'
  },
  RETRYABLE_FAILURE: {
    text: '发送失败，正在自动重试',
    hint: '系统会自动重试，通常无需处理。'
  },
  PERMANENT_FAILURE: {
    text: '微信拒收，不会自动重试',
    hint: '核对模板配置与活动信息后可点「重新发送」。'
  },
  SENT: {
    text: '已送达',
    hint: ''
  }
}

export interface ReasonView {
  text: string
  hint: string
}

/**
 * 重发对这条记录有没有意义。
 *
 * 微信的订阅授权是「一次授权一条」，学生当初没点「允许」，这条授权就不存在了——
 * 再发一次仍然会被跳过。给一个点了必然无效的按钮，比不给更让人困惑。
 * 其余原因（模板没配、活动缺时间、微信临时拒收）都是可以先修好再重发的。
 */
export function retryMakesSense(reasonCode: string): boolean {
  return reasonCode !== 'SKIPPED_NO_AUTH'
}

/**
 * 未收录的 code 一律回落到原始 lastError——宁可让老师看到一行技术文本，
 * 也好过显示空白让人以为没问题。
 */
export function reasonView(reasonCode: string, lastError: string | null): ReasonView {
  if (!reasonCode) {
    return { text: '', hint: '' }
  }
  const known = REASON_LABELS[reasonCode]
  if (known) return known
  return {
    text: lastError || '未知原因',
    hint: '如需排查请把这行文字提供给技术支持。'
  }
}
