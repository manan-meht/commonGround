import { NextRequest, NextResponse } from 'next/server'
import { CreateCaseSchema } from '@/lib/validation/schemas'
import { getServiceClient } from '@/lib/db/client'
import { generateSecureToken, hashToken, generatePublicReference, inviteExpiresAt } from '@/lib/tokens'
import { setSessionCookie } from '@/lib/auth/session'
import { isEmail } from '@/lib/utils'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = CreateCaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const {
    initiatorName,
    initiatorContact,
    recipientName,
    recipientPhone,
    topic,
    consentVersion,
  } = parsed.data

  const initiatorEmail = isEmail(initiatorContact) ? initiatorContact : null
  const initiatorPhone = isEmail(initiatorContact) ? null : initiatorContact

  try {
    const db = getServiceClient()
    const publicReference = generatePublicReference()

    // Generate tokens
    const initiatorToken = generateSecureToken()
    const invitationToken = generateSecureToken()
    const initiatorTokenHash = hashToken(initiatorToken)
    const invitationTokenHash = hashToken(invitationToken)
    const expiresAt = inviteExpiresAt(7)

    // Create the case
    const { data: caseRow, error: caseError } = await db
      .from('cases')
      .insert({
        public_reference: publicReference,
        topic,
        status: 'awaiting_initiator',
        initiator_name: initiatorName,
        recipient_name: recipientName,
        initiator_email: initiatorEmail,
        initiator_phone: initiatorPhone,
        recipient_phone: recipientPhone,
        consent_version: consentVersion,
        invitation_token_hash: invitationTokenHash,
        invite_expires_at: expiresAt.toISOString(),
      })
      .select('id, public_reference')
      .single()

    if (caseError || !caseRow) {
      console.error('[POST /api/cases] DB error:', caseError?.message)
      return NextResponse.json({ error: 'Failed to create case.' }, { status: 500 })
    }

    // Create the initiator participant record
    const { data: participantRow, error: participantError } = await db
      .from('participants')
      .insert({
        case_id: caseRow.id,
        role: 'initiator',
        display_name: initiatorName,
        email: initiatorEmail,
        phone: initiatorPhone,
        access_token_hash: initiatorTokenHash,
        consented_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (participantError || !participantRow) {
      console.error('[POST /api/cases] Participant error:', participantError?.message)
      return NextResponse.json({ error: 'Failed to create participant record.' }, { status: 500 })
    }

    // Audit
    await db.from('audit_events').insert({
      case_id: caseRow.id,
      participant_id: participantRow.id,
      event_type: 'case_created',
      ip_address: req.headers.get('x-forwarded-for') ?? null,
    })

    // Establish session
    await setSessionCookie({
      participantId: participantRow.id,
      caseId: caseRow.id,
      caseReference: caseRow.public_reference,
      role: 'initiator',
    })

    const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
    const inviteLink = `${appUrl}/invite/${invitationToken}`

    if (process.env['DEMO_MODE'] === 'true') {
      console.warn(`[DEMO] Invitation link for ${recipientName}: ${inviteLink}`)
    }

    return NextResponse.json({
      caseReference: publicReference,
      caseId: caseRow.id,
      inviteLink,
      recipientName,
    })
  } catch (err) {
    console.error('[POST /api/cases] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
