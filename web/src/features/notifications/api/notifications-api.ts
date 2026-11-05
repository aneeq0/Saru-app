import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { AppNotification } from '@/types/entities'

export type NotificationListParams = PaginatedRequest

export function listNotifications(params: NotificationListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  })
  return api.get<PaginatedResponse<AppNotification>>(`/notifications?${q.toString()}`, { signal })
}
