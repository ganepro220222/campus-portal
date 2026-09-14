declare module '@/utils/imagePreviewBind.mjs' {
  export const IMAGE_PREVIEW_RETRY_MS: number
  export const IMAGE_PREVIEW_MAX_RETRIES: number

  export function nextImagePreviewRetry(
    retryCount: number,
    boundSrc: string | null | undefined,
    failedSrc: string | null | undefined
  ): { retryCount: number; delayMs: number } | null
}
