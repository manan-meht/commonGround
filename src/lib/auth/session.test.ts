import { describe, it, expect, beforeAll } from 'vitest'
import { createSession, verifySession } from './session'

const TEST_SECRET = 'a-test-secret-that-is-at-least-32-chars-long-for-hs256'

beforeAll(() => {
  process.env['SESSION_SECRET'] = TEST_SECRET
})

const PAYLOAD = {
  participantId: 'participant-uuid',
  caseId: 'case-uuid',
  caseReference: 'abcdef123456',
  role: 'initiator' as const,
}

describe('createSession / verifySession', () => {
  it('creates a valid JWT and verifies it', async () => {
    const token = await createSession(PAYLOAD)
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // JWT has 3 parts

    const verified = await verifySession(token)
    expect(verified).not.toBeNull()
    expect(verified?.participantId).toBe(PAYLOAD.participantId)
    expect(verified?.caseId).toBe(PAYLOAD.caseId)
    expect(verified?.role).toBe('initiator')
  })

  it('returns null for an invalid token', async () => {
    const result = await verifySession('invalid.token.here')
    expect(result).toBeNull()
  })

  it('returns null for a tampered token', async () => {
    const token = await createSession(PAYLOAD)
    const parts = token.split('.')
    const tampered = `${parts[0]}.${parts[1]}TAMPERED.${parts[2]}`
    const result = await verifySession(tampered)
    expect(result).toBeNull()
  })
})
