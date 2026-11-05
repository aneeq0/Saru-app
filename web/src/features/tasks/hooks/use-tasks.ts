import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/services/api/query-keys'
import {
  listTasks,
  type TaskListParams,
} from '../api/tasks-api'

export function useTasksList(params: TaskListParams) {
  return useQuery({
    queryKey: queryKeys.tasks.list(params),
    queryFn: ({ signal }) => listTasks(params, signal),
    placeholderData: (prev) => prev,
  })
}
