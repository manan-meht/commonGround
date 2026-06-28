import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST — Party A approves the brief; makes the invite link active
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { id: caseId } = await params
  const session = await getSession()
  if (!session || session.caseId !== caseId || session.role !== 'initiator') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const db = getServiceClient()

  const { data: caseRow } = await db
    .from('cases')
    .select('invitation_brief, invitation_brief_approved_at')
    .eq('id', caseId)
    .single()

  if (!caseRow) return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
  if (!caseRow.invitation_brief) {
    return NextResponse.json({ error: 'No brief to approve. Generate one first.' }, { status: 422 })
  }
  if (caseRow.invitation_brief_approved_at) {
    // Already approved — idempotent
    return NextResponse.json({ approvedAt: caseRow.invitation_brief_approved_at })
  }

  const approvedAt = new Date().toISOString()
  await db
    .from('cases')
    .update({ invitation_brief_approved_at: approvedAt })
    .eq('id', caseId)

  await db.from('audit_events').insert({
    case_id: caseId,
    participant_id: session.participantId,
    event_type: 'invitation_brief_approved',
    metadata: null,
  })

  return NextResponse.json({ approvedAt })
}
