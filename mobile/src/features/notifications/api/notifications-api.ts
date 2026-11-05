import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { AppNotification } from '@/types/entities'

export const notificationsApi = {
  listNotifications: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<AppNotification>>(`/notifications${buildListQuery(params)}`),
  markRead: (id: string) => gateway.patch<AppNotification>(`/notifications/${id}/read`),
}
