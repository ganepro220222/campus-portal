declare module '@/utils/pastedBackground.mjs' {
  export function isPastedWhite(color: string | null | undefined): boolean
  export function dropPastedBackgrounds(html: string | null | undefined): string
}
