declare module '@/utils/feedbackListPage.mjs' {
  export const FEEDBACK_REPLY_SUCCESS_MESSAGE: string

  export function loadFeedbackListPage(input: {
    page: number
    pageSize: number
    statusFilter?: string
    fetchFeedbacks: (
      page: number,
      size: number,
      status?: string
    ) => Promise<{ records: unknown[]; total: number }>
    normalizeListPage: (page: number, total: number, pageSize: number) => number
  }): Promise<{ page: number; records: unknown[]; total: number }>

  export function reloadFeedbackListQuietly(
    reloadList: () => Promise<unknown>
  ): Promise<{ reloadFailed: boolean }>

  export function runFeedbackReplyAndReload(input: {
    currentId: number
    reply: string
    replyFeedback: (id: number, reply: string) => Promise<unknown>
    reloadList: () => Promise<unknown>
    onSaved?: (saved: { updated: unknown; successMessage: string }) => void
  }): Promise<{
    updated: unknown
    successMessage: string
    reloadFailed: boolean
  }>
}
