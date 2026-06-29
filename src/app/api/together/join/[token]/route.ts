import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/db/client'
import { hashToken } from '@/lib/tokens'
import { createParticipantSession } from '@/lib/auth/togetherParticipantSession'

const SESSION_MAX_AGE = 60 * 60 * 24 * 2 // 2 days

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const tokenHash = hashToken(token)

  const db = getServiceClient()
  const { data: session } = await db
    .from('together_sessions')
    .select('id, stage, device_mode, person_b_name, case_id, cases!inner(public_reference)')
    .eq('person_b_token_hash', tokenHash)
    .single()

  if (!session || session.device_mode !== 'separate') {
    return NextResponse.redirect(new URL('/together/join-invalid', req.url))
  }

  type S = typeof session & { cases: { public_reference: string } }
  const caseReference = (session as S).cases.public_reference

  const destination = session.stage === 'completed'
    ? `/together/${caseReference}/final`
    : `/together/${caseReference}/session`

  // Set cookie directly on the redirect response so it's included in the same HTTP response
  const jwt = await createParticipantSession({
    sessionId: session.id,
    caseId: session.case_id,
    caseReference,
    speaker: 'person_b',
    personBName: session.person_b_name,
  })

  const response = NextResponse.redirect(new URL(destination, req.url))
  response.cookies.set('together_participant', jwt, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
  return response
}
