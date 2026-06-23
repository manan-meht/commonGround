import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/db/client'
import { hashToken, isTokenExpired } from '@/lib/tokens'
import { setSessionCookie } from '@/lib/auth/session'
import { AcceptInvitationSchema } from '@/lib/validation/schemas'

interface RouteParams {
  params: Promise<{ token: string }>
}

// GET — validate invitation token and return case meta (no private data)
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { token } = await params
  if (!token) return NextResponse.json({ error: 'Token is required.' }, { status: 400 })

  const tokenHash = hashToken(token)
  const db = getServiceClient()

  const { data: caseRow, error } = await db
    .from('cases')
    .select('id, public_reference, topic, initiator_name, recipient_name, status, invite_expires_at')
    .eq('invitation_token_hash', tokenHash)
    .single()

  if (error || !caseRow) {
    return NextResponse.json({ error: 'Invitation not found or has expired.' }, { status: 404 })
  }

  if (isTokenExpired(caseRow.invite_expires_at)) {
    return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 })
  }

  if (caseRow.status === 'declined' || caseRow.status === 'closed') {
    return NextResponse.json({ error: 'This invitation is no longer active.' }, { status: 410 })
  }

  return NextResponse.json({
    topic: caseRow.topic,
    initiatorName: caseRow.initiator_name,
    recipientName: caseRow.recipient_name,
    caseReference: caseRow.public_reference,
    status: caseRow.status,
  })
}

// POST — accept the invitation and create recipient session
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { token } = await params
  if (!token) return NextResponse.json({ error: 'Token is required.' }, { status: 400 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const parsed = AcceptInvitationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const tokenHash = hashToken(token)
  const db = getServiceClient()

  const { data: caseRow, error } = await db
    .from('cases')
    .select('id, public_reference, recipient_name, invite_expires_at, status')
    .eq('invitation_token_hash', tokenHash)
    .single()

  if (error || !caseRow) {
    return NextResponse.json({ error: 'Invitation not found.' }, { status: 404 })
  }

  if (isTokenExpired(caseRow.invite_expires_at)) {
    return NextResponse.json({ error: 'This invitation has expired.' }, { status: 410 })
  }

  if (['declined', 'closed'].includes(caseRow.status)) {
    return NextResponse.json({ error: 'This invitation is no longer active.' }, { status: 410 })
  }

  // Check if recipient participant already exists
  const { data: existingParticipant } = await db
    .from('participants')
    .select('id')
    .eq('case_id', caseRow.id)
    .eq('role', 'recipient')
    .single()

  let participantId: string

  if (existingParticipant) {
    participantId = existingParticipant.id

    // Update last_accessed
    await db
      .from('participants')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', participantId)
  } else {
    // Generate a new access token for the recipient
    const { generateSecureToken, hashToken: ht } = await import('@/lib/tokens')
    const recipientToken = generateSecureToken()
    const recipientTokenHash = ht(recipientToken)

    const displayName = parsed.data.recipientName ?? caseRow.recipient_name

    const { data: newParticipant, error: pe } = await db
      .from('participants')
      .insert({
        case_id: caseRow.id,
        role: 'recipient',
        display_name: displayName,
        access_token_hash: recipientTokenHash,
        invitation_accepted_at: new Date().toISOString(),
        consented_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (pe || !newParticipant) {
      return NextResponse.json({ error: 'Failed to create participant record.' }, { status: 500 })
    }

    participantId = newParticipant.id

    // Update case status to awaiting_recipient
    await db
      .from('cases')
      .update({ status: 'awaiting_recipient' })
      .eq('id', caseRow.id)
      .in('status', ['awaiting_initiator', 'awaiting_recipient'])

    await db.from('audit_events').insert({
      case_id: caseRow.id,
      participant_id: participantId,
      event_type: 'invitation_accepted',
      ip_address: req.headers.get('x-forwarded-for') ?? null,
    })
  }

  await setSessionCookie({
    participantId,
    caseId: caseRow.id,
    caseReference: caseRow.public_reference,
    role: 'recipient',
  })

  return NextResponse.json({ caseReference: caseRow.public_reference })
}
