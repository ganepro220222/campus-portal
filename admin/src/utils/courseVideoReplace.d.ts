declare module '@/utils/courseVideoReplace.mjs' {
  export function shouldConfirmCourseVideoReplace(input: {
    previousVideo?: string | null
    nextVideo?: string | null
    learnerCount?: number | null
  }): boolean

  export function buildCourseVideoReplaceConfirm(input: {
    learnerCount?: number | null
  }): {
    title: string
    message: string
    confirmButtonText: string
    cancelButtonText: string
  }

  export function confirmCourseVideoReplaceIfNeeded(input: {
    previousVideo?: string | null
    nextVideo?: string | null
    learnerCount?: number | null
    prompt: (opts: {
      title: string
      message: string
      confirmButtonText: string
      cancelButtonText: string
    }) => Promise<unknown>
  }): Promise<boolean>
}
