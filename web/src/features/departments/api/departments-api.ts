import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Department } from '@/types/entities'

export interface DepartmentListParams extends PaginatedRequest {
  status?: string
}

export function listDepartments(params: DepartmentListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<Department>>(`/departments?${q.toString()}`, { signal })
}

export function getDepartment(id: string, signal?: AbortSignal) {
  return api.get<Department>(`/departments/${id}`, { signal })
}
