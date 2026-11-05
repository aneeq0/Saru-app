import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SortingState } from '@tanstack/react-table'

export interface TableState {
  page: number
  pageSize: number
  search: string
  sorting: SortingState
  filters: Record<string, string>
}

export function useUrlTableState(defaults?: Partial<TableState>) {
  const [params, setParams] = useSearchParams()

  const state = useMemo<TableState>(() => {
    const sortBy = params.get('sortBy')
    const sortDir = params.get('sortDir')
    const filters: Record<string, string> = {}
    params.forEach((value, key) => {
      if (key.startsWith('f_')) filters[key.slice(2)] = value
    })
    return {
      page: Number(params.get('page') ?? defaults?.page ?? 1),
      pageSize: Number(params.get('pageSize') ?? defaults?.pageSize ?? 20),
      search: params.get('q') ?? defaults?.search ?? '',
      sorting: sortBy
        ? [{ id: sortBy, desc: sortDir === 'desc' }]
        : (defaults?.sorting ?? []),
      filters: { ...(defaults?.filters ?? {}), ...filters },
    }
  }, [params, defaults])

  const setState = useCallback(
    (patch: Partial<TableState>) => {
      const next = new URLSearchParams(params)
      const page = patch.page ?? state.page
      const pageSize = patch.pageSize ?? state.pageSize
      const search = patch.search ?? state.search
      const sorting = patch.sorting ?? state.sorting
      const filters = patch.filters ?? state.filters

      next.set('page', String(page))
      next.set('pageSize', String(pageSize))
      if (search) next.set('q', search)
      else next.delete('q')

      if (sorting[0]) {
        next.set('sortBy', sorting[0].id)
        next.set('sortDir', sorting[0].desc ? 'desc' : 'asc')
      } else {
        next.delete('sortBy')
        next.delete('sortDir')
      }

      Array.from(next.keys())
        .filter((k) => k.startsWith('f_'))
        .forEach((k) => next.delete(k))
      Object.entries(filters).forEach(([k, v]) => {
        if (v) next.set(`f_${k}`, v)
      })

      setParams(next, { replace: true })
    },
    [params, setParams, state],
  )

  return { state, setState }
}
