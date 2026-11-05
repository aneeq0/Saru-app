import type { PaginatedRequest } from '@/types/api'

export function appendListQuery(
  params: PaginatedRequest & Record<string, string | number | undefined>,
): URLSearchParams {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    if (key === 'search') {
      q.set('q', String(value))
      continue
    }
    q.set(key, String(value))
  }
  return q
}
