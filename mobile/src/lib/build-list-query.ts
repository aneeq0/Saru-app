import type { PaginatedRequest } from '@/types/api'

export function buildListQuery(params?: PaginatedRequest): string {
  if (!params) return ''
  const search = new URLSearchParams()
  if (params.page != null) search.set('page', String(params.page))
  if (params.pageSize != null) search.set('pageSize', String(params.pageSize))
  if (params.search) search.set('q', params.search)
  if (params.sortBy) search.set('sortBy', params.sortBy)
  if (params.sortDir) search.set('sortDir', params.sortDir)
  if (params.cursor) search.set('cursor', params.cursor)
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}
