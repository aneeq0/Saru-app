export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error?: string
  code?: string
  details?: Record<string, string[]>
  requestId?: string
}

export interface PaginatedRequest {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  search?: string
  cursor?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    nextCursor?: string | null
  }
}

export interface IdResponse {
  id: string
}

export interface MutationResult<T = unknown> {
  data: T
  message?: string
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export type EntityStatus = 'active' | 'inactive' | 'draft' | 'archived'

export interface AuditMeta {
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  version?: number
}
