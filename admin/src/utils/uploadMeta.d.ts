declare module '@/utils/directPending.mjs' {
  export const DIRECT_PENDING_KEY: string
  export const DIRECT_PENDING_MAX_AGE_MS: number
  export function parseDirectPending(raw: unknown, now?: number): {
    scene: string
    objectKey: string
    size: number
    fileName: string
    uploadedAt: number
  } | null
  export function pendingForScene<T extends { scene: string } | null | undefined>(
    pending: T,
    scene: string
  ): T | null
}

declare module '@/utils/uploadMeta.mjs' {
  export function extractFileExtension(fileName: string): string
  export function extractFileNameFromUrl(url: string): string
  export function isStoredObjectFileName(name: string): boolean
  export function formatUploadPreviewLabel(input: {
    url?: string
    originalName?: string
    displayName?: string
  }): string
  export function inferResourceFileType(fileName: string): string
  export function isDirectUploadCandidate(scene: string, fileName: string): boolean
  export function formatByteLimit(bytes: number): string
  export function bytesToFileSizeKb(sizeBytes: number): number | undefined
  export function formatFileSizeKb(kb: number | undefined): string
  export function secondsToDurationMinutes(seconds: number): number | undefined
  export function formatFileBadge(input: { url?: string; originalName?: string }): {
    label: string
    tone: 'pdf' | 'word' | 'ppt' | 'excel' | 'subtitle' | 'media' | 'generic'
  }
  export function formatUploadedAt(value: string | number | Date | undefined): string
  export function formatFileMetaLine(input: { sizeBytes?: number; uploadedAt?: string }): string
  export function formatDurationClock(seconds: number): string
  export function parseSubtitleCues(text: string | null | undefined, limit?: number): {
    total: number
    cues: { start: string; end: string; text: string }[]
  }
  export function readVideoDurationSeconds(file: File): Promise<number | null>
}

declare module '../../utils/uploadMeta.mjs' {
  export function extractFileExtension(fileName: string): string
  export function extractFileNameFromUrl(url: string): string
  export function isStoredObjectFileName(name: string): boolean
  export function formatUploadPreviewLabel(input: {
    url?: string
    originalName?: string
    displayName?: string
  }): string
  export function inferResourceFileType(fileName: string): string
  export function isDirectUploadCandidate(scene: string, fileName: string): boolean
  export function formatByteLimit(bytes: number): string
  export function bytesToFileSizeKb(sizeBytes: number): number | undefined
  export function formatFileSizeKb(kb: number | undefined): string
  export function secondsToDurationMinutes(seconds: number): number | undefined
  export function formatFileBadge(input: { url?: string; originalName?: string }): {
    label: string
    tone: 'pdf' | 'word' | 'ppt' | 'excel' | 'subtitle' | 'media' | 'generic'
  }
  export function formatUploadedAt(value: string | number | Date | undefined): string
  export function formatFileMetaLine(input: { sizeBytes?: number; uploadedAt?: string }): string
  export function formatDurationClock(seconds: number): string
  export function parseSubtitleCues(text: string | null | undefined, limit?: number): {
    total: number
    cues: { start: string; end: string; text: string }[]
  }
  export function readVideoDurationSeconds(file: File): Promise<number | null>
}
