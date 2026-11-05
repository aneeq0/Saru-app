import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listNotifications,
  type NotificationListParams,
} from '../api/notifications-api'

export function useNotificationsList(params: NotificationListParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: ({ signal }) => listNotifications(params, signal),
    placeholderData: (prev) => prev,
  })
}
