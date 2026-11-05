import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { TaskItem } from '@/types/entities'

export type TaskListParams = PaginatedRequest

export function listTasks(params: TaskListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
  })
  return api.get<PaginatedResponse<TaskItem>>(`/tasks?${q.toString()}`, { signal })
}
