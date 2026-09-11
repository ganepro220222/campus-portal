declare module '@/utils/pagedRecords.mjs' {
  export function loadAllPagedRecords<T>(
    fetchPage: (page: number, size: number) => Promise<{ records?: T[]; total?: number }>,
    size?: number,
    maxPages?: number
  ): Promise<T[]>
}
