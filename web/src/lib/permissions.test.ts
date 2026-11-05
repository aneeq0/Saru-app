import { describe, expect, it } from 'vitest'
import { getPermissionsForRole, hasPermission, canViewModule } from './permissions'
import type { AuthUser } from '@/types/auth'

function user(role: AuthUser['role'], overrides?: Partial<AuthUser>): AuthUser {
  return {
    id: 'u-1',
    email: 'test@saru.demo',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    role,
    roleLabel: role,
    status: 'active',
    permissions: getPermissionsForRole(role),
    ...overrides,
  }
}

describe('permissions', () => {
  it('grants owner full administer on employees', () => {
    expect(hasPermission(user('owner'), 'employees:administer')).toBe(true)
  })

  it('denies auditor create on products', () => {
    expect(hasPermission(user('auditor'), 'products:create')).toBe(false)
    expect(canViewModule(user('auditor'), 'products')).toBe(true)
  })

  it('denies inactive users even with permissions listed', () => {
    const inactive = user('owner', { status: 'inactive' })
    expect(hasPermission(inactive, 'dashboard:view')).toBe(false)
  })

  it('allows accounts officer to finalize invoices', () => {
    expect(hasPermission(user('accounts_officer'), 'invoices:finalize')).toBe(true)
  })
})
