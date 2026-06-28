import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/db/client'
import { createClient } from '@/lib/supabase/server'
import { setSessionCookie } from '@/lib/auth/session'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/cases/[id]/session — restore cg_session for a logged-in user
// who owns a case (as initiator or recipient) but lacks the cookie.
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { id: caseId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const db = getServiceClient()

  // Find the participant row for this user on this case.
  const { data: participant } = await db
    .from('participants')
    .select('id, role, cases(id, public_reference, status)')
    .eq('case_id', caseId)
    .eq('user_id', user.id)
    .single()

  if (!participant) {
    return NextResponse.json({ error: 'Case not found.' }, { status: 404 })
  }

  const caseRow = participant.cases as unknown as { id: string; public_reference: string; status: string } | null
  if (!caseRow) return NextResponse.json({ error: 'Case not found.' }, { status: 404 })

  await setSessionCookie({
    participantId: participant.id,
    caseId: caseRow.id,
    caseReference: caseRow.public_reference,
    role: participant.role as 'initiator' | 'recipient',
  })

  const status = caseRow.status
  let destination: string
  if (['report_ready', 'needs_safety_review'].includes(status)) {
    destination = `/case/${caseRow.public_reference}/report`
  } else if (status === 'complete' || status === 'closed') {
    destination = `/case/${caseRow.public_reference}/feedback`
  } else {
    destination = `/case/${caseRow.public_reference}/intake`
  }

  return NextResponse.json({ destination })
}
