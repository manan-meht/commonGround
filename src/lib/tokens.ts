/**
 * Cryptographically secure token generation and hashing.
 * Tokens are given to participants; only their SHA-256 hashes are stored in the DB.
 */

import { randomBytes, createHash } from 'crypto'

const ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789'

export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generatePublicReference(): string {
  const bytes = randomBytes(12)
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('')
}

export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true
  return new Date(expiresAt) < new Date()
}

export function inviteExpiresAt(days = 7): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}
