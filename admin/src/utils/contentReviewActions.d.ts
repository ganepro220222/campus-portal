declare module '@/utils/contentReviewActions.mjs' {
  export const CONTENT_REVIEWER_PERMISSIONS: readonly string[]

  export function hasContentPermission(permissions: string[] | null | undefined, required: string): boolean

  export function resolveContentRowActions(input: {
    permissions: string[]
    module: 'news' | 'hall' | 'course'
    status: string | number | null | undefined
    publishedValue: string | number
  }): {
    canRead: boolean
    canWrite: boolean
    canPublish: boolean
    published: boolean
    showView: boolean
    showEdit: boolean
    showPublish: boolean
    showUnpublish: boolean
    showDelete: boolean
  }

  export function resolveContentDialogMode(input: {
    hasRow: boolean
    canWrite: boolean
    requested?: 'view' | 'edit' | 'create' | null
  }): 'create' | 'edit' | 'view'

  export function resolveContentDialogTitle(input: {
    moduleLabel: string
    mode: 'create' | 'edit' | 'view'
  }): string

  export function isReviewFilePreviewEnabled(input: {
    formDisabled: boolean
    previewIsNativeButton: boolean
  }): boolean

  export function resolveContentDialogFooter(input: {
    mode: 'create' | 'edit' | 'view'
    canPublish: boolean
    published: boolean
    detailReady: boolean
    detailLoading?: boolean
    publishLabel?: string
    unpublishLabel?: string
  }): {
    readonly: boolean
    closeText: string
    showSave: boolean
    showPublish: boolean
    showUnpublish: boolean
    publishDisabled: boolean
    publishLabel: string
    unpublishLabel: string
  }
}
