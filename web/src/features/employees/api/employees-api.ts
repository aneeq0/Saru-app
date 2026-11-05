import { api } from '@/services/api/client'
import { appendListQuery } from '@/services/api/list-query'
import type { PaginatedRequest, PaginatedResponse } from '@/types/api'
import type { Employee } from '@/types/entities'

export interface EmployeeListParams extends PaginatedRequest {
  status?: string
}

export function listEmployees(params: EmployeeListParams, signal?: AbortSignal) {
  const q = appendListQuery({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortBy: params.sortBy,
    sortDir: params.sortDir,
    status: params.status,
  })
  return api.get<PaginatedResponse<Employee>>(`/employees?${q.toString()}`, { signal })
}

export function getEmployee(id: string, signal?: AbortSignal) {
  return api.get<Employee>(`/employees/${id}`, { signal })
}
