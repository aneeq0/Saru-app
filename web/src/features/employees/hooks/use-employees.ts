import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listEmployees,
  getEmployee,
  type EmployeeListParams,
} from '../api/employees-api'

export function useEmployeesList(params: EmployeeListParams) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: ({ signal }) => listEmployees(params, signal),
    placeholderData: (prev) => prev,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: ({ signal }) => getEmployee(id, signal),
    enabled: Boolean(id),
  })
}
