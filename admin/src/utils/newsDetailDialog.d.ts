declare module '@/utils/newsDetailDialog.mjs' {
  export interface NewsDetailDialogSession {
    begin(): number
    isCurrent(requestSeq: number): boolean
  }

  export function createNewsDetailDialogSession(): NewsDetailDialogSession

  export function isNewsDraftSaveLocked(input: {
    saving: boolean
    detailLoading: boolean
  }): boolean

  export function openNewsDetailDialog<T extends { id: number }>(input: {
    row?: T | null
    session: NewsDetailDialogSession
    resetForm: () => void
    applyForm: (row: T) => void
    fetchDetail: (id: number) => Promise<T>
    setEditingId: (id: number | null) => void
    setDialogVisible: (visible: boolean) => void
    setDetailLoading: (loading: boolean) => void
    onLoadError?: () => void
  }): Promise<{ outcome: 'create' | 'loaded' | 'stale' | 'error'; seq: number }>
}
