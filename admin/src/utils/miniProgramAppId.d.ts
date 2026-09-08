declare module '@/utils/miniProgramAppId.mjs' {
  export const MINI_PROGRAM_APPID_PATTERN: RegExp
  export const MINI_PROGRAM_APPID_REQUIRED_MESSAGE: string
  export const MINI_PROGRAM_APPID_FORMAT_MESSAGE: string
  export const MINI_PROGRAM_APPID_HINT: string
  export function normalizeMiniProgramAppId(value: unknown): string
  export function isMiniProgramAppIdFormat(value: unknown): boolean
  export function validateMiniProgramAppId(value: unknown):
    | { ok: true; appId: string }
    | { ok: false; message: string }
}
