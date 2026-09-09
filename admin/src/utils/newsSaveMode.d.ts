declare module '@/utils/newsSaveMode.mjs' {
  export function resolveNewsSaveMode(input: {
    editingId: number | null | undefined
    status: string | null | undefined
  }): {
    kind: 'createDraft' | 'updateDraft' | 'updateLive'
    buttonText: string
    successText: string
    needsLiveConfirm: boolean
    warning: string
    confirmTitle: string
    confirmMessage: string
  }
}
