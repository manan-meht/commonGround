import { describe, it, expect } from 'vitest'
import {
  generateSecureToken,
  hashToken,
  generatePublicReference,
  isTokenExpired,
  inviteExpiresAt,
} from './tokens'

describe('generateSecureToken', () => {
  it('generates a non-empty string', () => {
    const token = generateSecureToken()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(20)
  })

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken()))
    expect(tokens.size).toBe(100)
  })
})

describe('hashToken', () => {
  it('produces a 64-char hex string', () => {
    const hash = hashToken('some_token')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic', () => {
    const token = 'deterministic_test_token'
    expect(hashToken(token)).toBe(hashToken(token))
  })

  it('is different for different tokens', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'))
  })
})

describe('generatePublicReference', () => {
  it('generates a 12-char lowercase alphanumeric string', () => {
    const ref = generatePublicReference()
    expect(ref).toMatch(/^[a-z2-9]{12}$/)
  })

  it('generates unique references', () => {
    const refs = new Set(Array.from({ length: 100 }, () => generatePublicReference()))
    expect(refs.size).toBe(100)
  })
})

describe('isTokenExpired', () => {
  it('returns true for null', () => {
    expect(isTokenExpired(null)).toBe(true)
  })

  it('returns true for a past date', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    expect(isTokenExpired(past)).toBe(true)
  })

  it('returns false for a future date', () => {
    const future = new Date(Date.now() + 100000).toISOString()
    expect(isTokenExpired(future)).toBe(false)
  })
})

describe('inviteExpiresAt', () => {
  it('returns a date in the future', () => {
    const expires = inviteExpiresAt(7)
    expect(expires.getTime()).toBeGreaterThan(Date.now())
  })

  it('is approximately 7 days away', () => {
    const expires = inviteExpiresAt(7)
    const diffMs = expires.getTime() - Date.now()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    expect(diffDays).toBeGreaterThan(6.9)
    expect(diffDays).toBeLessThan(7.1)
  })
})
