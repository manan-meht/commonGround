/**
 * Together Mode — Person B participant session via signed JWT in HttpOnly cookie.
 * Used when device_mode is 'separate' and Person B joins via QR/link.
 * Server-only module.
 */

import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'together_participant'
const SESSION_MAX_AGE = 60 * 60 * 24 * 2 // 2 days

export interface TogetherParticipantPayload {
  sessionId: string
  caseId: string
  caseReference: string
  speaker: 'person_b'
  personBName: string
}

function getSecret(): Uint8Array {
  const secret = process.env['SESSION_SECRET']
  if (!secret) throw new Error('SESSION_SECRET is not configured.')
  return new TextEncoder().encode(secret)
}

export async function createParticipantSession(payload: TogetherParticipantPayload): Promise<string> {
  const secret = getSecret()
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret)
}

export async function verifyParticipantSession(token: string): Promise<TogetherParticipantPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as TogetherParticipantPayload
  } catch {
    return null
  }
}

export async function setParticipantCookie(payload: TogetherParticipantPayload): Promise<void> {
  const token = await createParticipantSession(payload)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function getParticipantSession(): Promise<TogetherParticipantPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyParticipantSession(token)
}

export async function clearParticipantSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
