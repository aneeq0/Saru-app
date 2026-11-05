export const REALTIME_NAMESPACE = '/realtime'
export const REALTIME_PATH = '/socket.io'

export interface RealtimeEventEnvelope {
  eventId: string
  type: string
  schemaVersion: number
  entityType: string
  entityId: string
  entityVersion?: number
  occurredAt: string
  scope: {
    rooms?: string[]
    userIds?: string[]
    warehouseIds?: string[]
  }
  changeSummary: string
  correlationId?: string
  meta?: Record<string, string | number | boolean | null>
}
