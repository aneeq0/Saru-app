import type { PaginatedResponse } from '@/types/api'

export interface ListQuery {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  filters?: Record<string, string>
}

const RESERVED_QUERY_KEYS = new Set([
  'page',
  'pageSize',
  'search',
  'q',
  'sortBy',
  'sortDir',
  'cursor',
])

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })
}

function getFieldValue(item: object, key: string): unknown {
  if (key in item) return (item as Record<string, unknown>)[key]
  return undefined
}

export function paginate<T extends object>(
  items: T[],
  query: ListQuery & { searchFields?: (keyof T & string)[] },
): PaginatedResponse<T> {
  const page = Math.max(1, query.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20))
  let result = [...items]

  const search = (query.search ?? '').trim().toLowerCase()
  if (search) {
    const fields =
      query.searchFields ??
      (['name', 'title', 'reference', 'code', 'sku', 'email'] as (keyof T & string)[])
    result = result.filter((item) =>
      fields.some((field) => {
        const value = item[field]
        return value != null && String(value).toLowerCase().includes(search)
      }),
    )
  }

  if (query.filters) {
    for (const [key, rawValue] of Object.entries(query.filters)) {
      if (!rawValue) continue
      const filterValue = rawValue.toLowerCase()
      result = result.filter((item) => {
        const value = getFieldValue(item, key)
        if (value == null) return false
        if (Array.isArray(value)) {
          return value.some((v) => String(v).toLowerCase() === filterValue)
        }
        return String(value).toLowerCase() === filterValue
      })
    }
  }

  if (query.sortBy) {
    const dir = query.sortDir === 'desc' ? -1 : 1
    const sortKey = query.sortBy
    result.sort((a, b) => {
      const cmp = compareValues(getFieldValue(a, sortKey), getFieldValue(b, sortKey))
      return cmp * dir
    })
  }

  const total = result.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * pageSize
  const data = result.slice(start, start + pageSize)

  return {
    data,
    meta: {
      page: safePage,
      pageSize,
      total,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
      nextCursor: null,
    },
  }
}

export function parseListQuery(url: URL): ListQuery {
  const pageRaw = url.searchParams.get('page')
  const pageSizeRaw = url.searchParams.get('pageSize')
  const search =
    url.searchParams.get('search') ?? url.searchParams.get('q') ?? undefined
  const sortBy = url.searchParams.get('sortBy') ?? undefined
  const sortDirParam = url.searchParams.get('sortDir')
  const sortDir =
    sortDirParam === 'asc' || sortDirParam === 'desc' ? sortDirParam : undefined

  const filters: Record<string, string> = {}
  url.searchParams.forEach((value, key) => {
    if (RESERVED_QUERY_KEYS.has(key)) return
    if (key.startsWith('f_')) {
      filters[key.slice(2)] = value
      return
    }
    if (key === 'status' || key === 'stage' || key === 'module' || key === 'category') {
      filters[key] = value
    }
  })

  return {
    page: pageRaw ? Number(pageRaw) : undefined,
    pageSize: pageSizeRaw ? Number(pageSizeRaw) : undefined,
    search: search ?? undefined,
    sortBy,
    sortDir,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  }
}

/** Simulated network latency (~250ms, deterministic). */
export function delay(ms?: number): Promise<void> {
  const resolved = ms ?? 250
  return new Promise((resolve) => {
    setTimeout(resolve, resolved)
  })
}
