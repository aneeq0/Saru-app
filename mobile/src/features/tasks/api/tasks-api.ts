import { buildListQuery } from '@/lib/build-list-query'
import { gateway } from '@/services/api/gateway'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { TaskItem } from '@/types/entities'

export const tasksApi = {
  listTasks: (params?: PaginatedRequest) =>
    gateway.get<PaginatedResponse<TaskItem>>(`/tasks${buildListQuery(params)}`),
}
