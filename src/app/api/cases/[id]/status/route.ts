import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id: caseId } = await params

  const session = await getSession()
  if (!session || session.caseId !== caseId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const db = getServiceClient()

  const { data: caseRow } = await db
    .from('cases')
    .select('status, topic, initiator_name, recipient_name')
    .eq('id', caseId)
    .single()

  if (!caseRow) {
    return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
  }

  // Fetch own participant status
  const { data: participant } = await db
    .from('participants')
    .select('intake_completed_at')
    .eq('id', session.participantId)
    .single()

  // Count how many participants have completed intake (without revealing WHO)
  const { count } = await db
    .from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('case_id', caseId)
    .not('intake_completed_at', 'is', null)

  return NextResponse.json({
    status: caseRow.status,
    topic: caseRow.topic,
    myIntakeComplete: !!participant?.intake_completed_at,
    completedParticipantCount: count ?? 0,
    totalParticipantCount: 2,
  })
}
