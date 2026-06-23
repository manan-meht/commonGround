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

  if (!['report_ready', 'needs_safety_review'].includes(caseRow.status)) {
    return NextResponse.json({ error: 'Report is not yet available.' }, { status: 404 })
  }

  const { data: analysis } = await db
    .from('analyses')
    .select('id, structured_result, safety_category, safety_explanation, created_at')
    .eq('case_id', caseId)
    .eq('status', 'complete')
    .single()

  if (!analysis?.structured_result) {
    return NextResponse.json({ error: 'Report not found.' }, { status: 404 })
  }

  const { data: agreements } = await db
    .from('agreements')
    .select('id, agreement_text, initiator_response, recipient_response')
    .eq('case_id', caseId)

  return NextResponse.json({
    report: analysis.structured_result,
    agreements: agreements ?? [],
    caseReference: caseId,
    generatedAt: analysis.created_at,
  })
}
