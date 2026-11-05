import { authHandlers } from '@/mocks/handlers/auth-handlers'
import { dashboardHandlers } from '@/mocks/handlers/dashboard-handlers'
import { resourceHandlers } from '@/mocks/handlers/resource-handlers'

export { __resetMockSession, __setMockSession } from '@/mocks/session'

export const handlers = [...authHandlers, ...dashboardHandlers, ...resourceHandlers]
