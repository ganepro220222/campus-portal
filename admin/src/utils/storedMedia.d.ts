declare module '@/utils/storedMedia.mjs' {
  export function extractManagedObjectKey(stored: string | null | undefined): string | null
  export function sameStoredMedia(left: string | null | undefined, right: string | null | undefined): boolean
}
