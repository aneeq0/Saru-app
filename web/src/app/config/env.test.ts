import { describe, expect, it } from 'vitest'
import { normalizeApiBaseUrl } from './env'

describe('normalizeApiBaseUrl', () => {
  it('adds https and /api when given a bare host', () => {
    expect(normalizeApiBaseUrl('saru-app-production.up.railway.app')).toBe(
      'https://saru-app-production.up.railway.app/api',
    )
  })

  it('adds /api when scheme is present but path is missing', () => {
    expect(normalizeApiBaseUrl('https://saru-app-production.up.railway.app')).toBe(
      'https://saru-app-production.up.railway.app/api',
    )
  })

  it('keeps an already-correct API URL', () => {
    expect(normalizeApiBaseUrl('https://saru-app-production.up.railway.app/api')).toBe(
      'https://saru-app-production.up.railway.app/api',
    )
  })

  it('keeps relative /api for local Vite proxy', () => {
    expect(normalizeApiBaseUrl('/api')).toBe('/api')
  })
})
