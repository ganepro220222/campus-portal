declare module '@/utils/openFetchedEditDialog.mjs' {
  export interface FetchedEditDialogSession {
    begin(): number
    isCurrent(requestSeq: number): boolean
  }

  export function createFetchedEditDialogSession(): FetchedEditDialogSession

  export function openFetchedEditDialog<T extends { id: number }, D = unknown>(input: {
    row?: T | null
    session: FetchedEditDialogSession
    resetForm: () => void
    fetchDetail: (id: number) => Promise<D>
    applyDetail: (detail: D) => void | Promise<void>
    setEditingId: (id: number | null) => void
    setDialogVisible: (visible: boolean) => void
  }): Promise<{ outcome: 'create' | 'loaded' | 'stale'; seq: number }>
}
