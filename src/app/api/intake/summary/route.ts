import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { generateIntakeSummary } from '@/lib/ai/intake'

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

  const transcript = (body as { transcript?: string }).transcript
  if (!transcript || typeof transcript !== 'string') {
    return NextResponse.json({ error: 'Transcript is required.' }, { status: 422 })
  }

  const db = getServiceClient()
  const { data: caseRow } = await db
    .from('cases')
    .select('topic, initiator_name, recipient_name')
    .eq('id', session.caseId)
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
  }

  const participantName =
    session.role === 'initiator' ? caseRow.initiator_name : caseRow.recipient_name
  const otherPartyName =
    session.role === 'initiator' ? caseRow.recipient_name : caseRow.initiator_name

  try {
    const summary = await generateIntakeSummary(
      { participantName, role: session.role, topic: caseRow.topic, otherPartyName },
      transcript
    )
    return NextResponse.json({ summary })
  } catch (err) {
    console.error('[POST /api/intake/summary]', err)
    return NextResponse.json({ error: 'Failed to generate summary.' }, { status: 500 })
  }
}
