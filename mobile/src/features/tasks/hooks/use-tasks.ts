import { useQuery } from '@tanstack/react-query'
import { tasksApi } from '@/features/tasks/api/tasks-api'
import { queryKeys } from '@/services/api/query-keys'
import type { PaginatedRequest } from '@/types/api'

export function useTasksList(params?: PaginatedRequest) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: () => tasksApi.listTasks(params),
  })
}
