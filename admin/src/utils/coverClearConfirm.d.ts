declare module '@/utils/coverClearConfirm.mjs' {
  export function isCoverBeingCleared(previous: string | null | undefined, next: string | null | undefined): boolean
  export function confirmCoverClearIfNeeded(
    previous: string | null | undefined,
    next: string | null | undefined,
    prompt: (opts: { message: string; title: string }) => Promise<unknown>
  ): Promise<boolean>
}
