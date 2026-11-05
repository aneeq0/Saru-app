import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from './protected-route'
import type { AuthUser } from '@/types/auth'

const demoUser: AuthUser = {
  id: 'u-1',
  email: 'owner@saru.demo',
  firstName: 'Ayesha',
  lastName: 'Khan',
  displayName: 'Ayesha Khan',
  role: 'owner',
  roleLabel: 'Owner',
  status: 'active',
  permissions: ['dashboard:view'],
}

const authState = vi.hoisted(() => ({
  status: 'authenticated' as 'idle' | 'loading' | 'authenticated' | 'unauthenticated',
  user: null as AuthUser | null,
  hasPermission: (_p: unknown) => true,
}))

vi.mock('@/features/auth/hooks/use-auth', () => ({
  useAuth: () => authState,
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.status = 'authenticated'
    authState.user = demoUser
    authState.hasPermission = () => true
  })

  it('renders children when authenticated', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route index element={<div>Secure content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Secure content')).toBeInTheDocument()
  })

  it('redirects unauthenticated users to login', () => {
    authState.status = 'unauthenticated'
    authState.user = null
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route path="/dashboard" element={<ProtectedRoute />}>
            <Route index element={<div>Secure content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Login screen')).toBeInTheDocument()
  })
})
