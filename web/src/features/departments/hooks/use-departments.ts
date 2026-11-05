import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listDepartments,
  getDepartment,
  type DepartmentListParams,
} from '../api/departments-api'

export function useDepartmentsList(params: DepartmentListParams) {
  return useQuery({
    queryKey: queryKeys.departments.list(params),
    queryFn: ({ signal }) => listDepartments(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: queryKeys.departments.detail(id),
    queryFn: ({ signal }) => getDepartment(id, signal),
    enabled: Boolean(id),
  })
}
