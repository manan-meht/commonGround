import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { generatePublicReference, generateSecureToken, hashToken } from '@/lib/tokens'
import { consumeRoomCredit } from '@/lib/db/credits'
import { CreateTogetherSessionSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = CreateTogetherSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { personAName, personBName, topic, relationship, deviceMode } = parsed.data

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

    const credited = await consumeRoomCredit(user.id)
    if (!credited) {
      return NextResponse.json(
        { error: 'no_credits', message: 'You have used your free room. Purchase a plan to start more conversations.' },
        { status: 402 }
      )
    }

    const db = getServiceClient()
    const publicReference = generatePublicReference()

    const { data: caseRow, error: caseError } = await db
      .from('cases')
      .insert({
        public_reference: publicReference,
        topic,
        status: 'awaiting_initiator',
        initiator_name: personAName,
        recipient_name: personBName,
        initiator_email: user.email ?? null,
        relationship: relationship ?? null,
        consent_version: '1.0',
        conversation_mode: 'together',
        user_id: user.id,
      })
      .select('id, public_reference')
      .single()

    if (caseError || !caseRow) {
      console.error('[POST /api/together/sessions] Case error:', caseError?.message)
      return NextResponse.json({ error: 'Failed to create case.' }, { status: 500 })
    }

    // Generate a join token for Person B when using separate devices
    let personBToken: string | null = null
    let personBTokenHash: string | null = null
    if (deviceMode === 'separate') {
      personBToken = generateSecureToken()
      personBTokenHash = hashToken(personBToken)
    }

    const { data: sessionRow, error: sessionError } = await db
      .from('together_sessions')
      .insert({
        case_id: caseRow.id,
        stage: 'consent',
        current_speaker: 'person_a',
        round_number: 1,
        person_a_name: personAName,
        person_b_name: personBName,
        topic,
        device_mode: deviceMode,
        person_b_token_hash: personBTokenHash,
      })
      .select('id')
      .single()

    if (sessionError || !sessionRow) {
      console.error('[POST /api/together/sessions] Session error:', sessionError?.message)
      return NextResponse.json({ error: 'Failed to create session.' }, { status: 500 })
    }

    await db.from('audit_events').insert({
      case_id: caseRow.id,
      event_type: 'together_session_created',
      metadata: { device_mode: deviceMode },
      ip_address: req.headers.get('x-forwarded-for') ?? null,
    })

    return NextResponse.json({
      caseReference: publicReference,
      caseId: caseRow.id,
      sessionId: sessionRow.id,
      deviceMode,
      // Only returned once — client must store it to show the QR code
      personBToken: personBToken ?? undefined,
    })
  } catch (err) {
    console.error('[POST /api/together/sessions] Unexpected error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
