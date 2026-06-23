import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { encryptToDb } from '@/lib/crypto'
import { IntakeMessageSchema } from '@/lib/validation/schemas'
import { continueIntake } from '@/lib/ai/intake'
import { decryptFromDb } from '@/lib/crypto'
import type { DbIntakeMessage } from '@/lib/db/types'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = IntakeMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { content } = parsed.data
  const { participantId, caseId, role } = session

  try {
    console.error('[intake/message] step: getServiceClient, SUPABASE_URL=', process.env['SUPABASE_URL'], 'HAS_KEY=', !!process.env['SUPABASE_SERVICE_ROLE_KEY'])
    const db = getServiceClient()

    console.error('[intake/message] step: query participant')
    const { data: participant, error: participantError } = await db
      .from('participants')
      .select('intake_completed_at')
      .eq('id', participantId)
      .single()

    if (participantError) console.error('[intake/message] participant error:', participantError)

    if (participant?.intake_completed_at) {
      return NextResponse.json({ error: 'Your intake has already been completed.' }, { status: 409 })
    }

    console.error('[intake/message] step: query history')
    const { data: existingMessages, error: historyError } = await db
      .from('intake_messages')
      .select('*')
      .eq('participant_id', participantId)
      .order('sequence_number', { ascending: true })

    if (historyError) console.error('[intake/message] history error:', historyError)

    const history = (existingMessages as DbIntakeMessage[] ?? []).map((m) => ({
      role: (m.role === 'participant' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: decryptFromDb(m),
    }))

    const nextSequence = (existingMessages?.length ?? 0) + 1

    console.error('[intake/message] step: encrypt and insert message')
    const encrypted = encryptToDb(content)
    const { error: insertError } = await db.from('intake_messages').insert({
      case_id: caseId,
      participant_id: participantId,
      role: 'participant',
      encrypted_content: encrypted.encrypted_content,
      encryption_iv: encrypted.encryption_iv,
      encryption_tag: encrypted.encryption_tag,
      sequence_number: nextSequence,
    })
    if (insertError) console.error('[intake/message] insert error:', JSON.stringify(insertError))

    console.error('[intake/message] step: query case')
    const { data: caseRow, error: caseError } = await db
      .from('cases')
      .select('topic, initiator_name, recipient_name')
      .eq('id', caseId)
      .single()

    if (caseError) console.error('[intake/message] case error:', JSON.stringify(caseError))
    if (!caseRow) {
      return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
    }

    const otherPartyName =
      role === 'initiator' ? caseRow.recipient_name : caseRow.initiator_name
    const participantName =
      role === 'initiator' ? caseRow.initiator_name : caseRow.recipient_name

    console.error('[intake/message] step: call OpenAI')
    const aiResponse = await continueIntake(
      { participantName, role, topic: caseRow.topic, otherPartyName },
      [...history, { role: 'user', content }]
    )

    console.error('[intake/message] step: insert AI response')
    const aiEncrypted = encryptToDb(aiResponse)
    const { error: aiInsertError } = await db.from('intake_messages').insert({
      case_id: caseId,
      participant_id: participantId,
      role: 'assistant',
      encrypted_content: aiEncrypted.encrypted_content,
      encryption_iv: aiEncrypted.encryption_iv,
      encryption_tag: aiEncrypted.encryption_tag,
      sequence_number: nextSequence + 1,
    })
    if (aiInsertError) console.error('[intake/message] ai insert error:', JSON.stringify(aiInsertError))

    return NextResponse.json({ message: aiResponse })
  } catch (err) {
    console.error('[POST /api/intake/message] Error:', err)
    return NextResponse.json({ error: 'Failed to process message.' }, { status: 500 })
  }
}
