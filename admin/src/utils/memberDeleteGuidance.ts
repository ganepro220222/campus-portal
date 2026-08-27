/** 删除影响预览中与本页文案相关的字段 */
export interface MemberDeleteGuidanceImpact {
  canDelete?: boolean
  canAnonymize?: boolean
  references?: Array<{ label: string; count: number }>
}

export interface MemberDeleteGuidance {
  risk: 'LOW' | 'BLOCKED'
  blockedTitle: string
  blockedDescription: string
  referenceHint: string
}

const ACTIONABLE = {
  blockedTitle: '暂时不能删除',
  blockedDescription: '下面这些内容还指着它。请先按提示处理，处理完再回来删除。',
  referenceHint:
    '这些记录要留着支撑历史统计。请改用「清退」——姓名、学号、手机号会被抹掉且无法再登录。'
} as const

const TERMINAL = {
  blockedTitle: '账号已完成清退',
  blockedDescription: '身份信息已经抹除，以下历史记录必须保留，无需再进行清退或删除。',
  referenceHint:
    '账号已完成清退，姓名、学号、手机号均已抹掉。为保留这些历史记录，该账号当前不能再彻底删除，无需继续操作。'
} as const

/**
 * 师生账号删除弹窗文案：区分「还能清退」与「已清退终态」。
 * canAnonymize 来自后端业务契约，比前端自行推导 anonymized 更可靠。
 */
export function memberDeleteGuidance(
  impact: MemberDeleteGuidanceImpact | null | undefined
): MemberDeleteGuidance | null {
  if (!impact) {
    return null
  }
  if (impact.canDelete === true) {
    return {
      risk: 'LOW',
      blockedTitle: '',
      blockedDescription: '',
      referenceHint: ''
    }
  }
  const copy = impact.canAnonymize === true ? ACTIONABLE : TERMINAL
  return {
    risk: 'BLOCKED',
    ...copy
  }
}
