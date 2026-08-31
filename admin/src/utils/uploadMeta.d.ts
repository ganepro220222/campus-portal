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
  export function bytesToFileSizeKb(sizeBytes: number): number | undefined
  export function formatFileSizeKb(kb: number | undefined): string
  export function secondsToDurationMinutes(seconds: number): number | undefined
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
  export function bytesToFileSizeKb(sizeBytes: number): number | undefined
  export function formatFileSizeKb(kb: number | undefined): string
  export function secondsToDurationMinutes(seconds: number): number | undefined
  export function readVideoDurationSeconds(file: File): Promise<number | null>
}
