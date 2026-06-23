import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { ReportFeedbackSchema } from '@/lib/validation/schemas'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: caseId } = await params

  const session = await getSession()
  if (!session || session.caseId !== caseId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = ReportFeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const db = getServiceClient()

  await db.from('audit_events').insert({
    case_id: caseId,
    participant_id: session.participantId,
    event_type: 'report_feedback',
    metadata: {
      representation_rating: parsed.data.representationRating,
      ready_to_talk: parsed.data.readyToTalkDirectly,
    },
  })

  return NextResponse.json({ success: true })
}
