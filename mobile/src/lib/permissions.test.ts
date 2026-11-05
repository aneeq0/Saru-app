import { canViewModule, getPermissionsForRole, hasPermission } from './permissions'
import type { AuthUser } from '@/types/auth'

function user(role: AuthUser['role']): AuthUser {
  return {
    id: 'u1',
    email: 't@saru.demo',
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    role,
    roleLabel: role,
    status: 'active',
    permissions: getPermissionsForRole(role),
  }
}

describe('mobile permissions', () => {
  it('allows inventory manager to view inventory', () => {
    expect(canViewModule(user('inventory_manager'), 'inventory')).toBe(true)
  })

  it('denies auditor create on deliveries', () => {
    expect(hasPermission(user('auditor'), 'deliveries:create')).toBe(false)
  })

  it('denies inactive users', () => {
    const inactive = { ...user('owner'), status: 'inactive' as const }
    expect(hasPermission(inactive, 'dashboard:view')).toBe(false)
  })
})
