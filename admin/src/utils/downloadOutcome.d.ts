declare module '@/utils/downloadOutcome.mjs' {
  export function interpretDownloadErrorBody(body: unknown): {
    kind: 'unparsed' | 'unauthorized' | 'rateLimited' | 'error'
    message?: string
  }
  export function shouldAnnounceDownloadStarted(downloaded: boolean | void): boolean
}
