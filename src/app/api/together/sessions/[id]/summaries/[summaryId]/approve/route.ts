import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { TogetherSummaryApprovalSchema } from '@/lib/validation/schemas'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; summaryId: string }> }
) {
  const { id, summaryId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = TogetherSummaryApprovalSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { approvedSummary } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const db = getServiceClient()

  const { data: session } = await db
    .from('together_sessions')
    .select('id, stage, current_speaker, round_number, case_id, person_a_name, person_b_name, cases!inner(user_id)')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

  type S = typeof session & { cases: { user_id: string } }
  if ((session as S).cases.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const validStages = ['person_a_summary_review', 'person_b_summary_review']
  if (!validStages.includes(session.stage)) {
    return NextResponse.json({ error: 'Not in a summary review stage.' }, { status: 409 })
  }

  // Update the summary
  const { error: summaryError } = await db
    .from('together_turn_summaries')
    .update({ approved_summary: approvedSummary, approved_at: new Date().toISOString() })
    .eq('id', summaryId)
    .eq('session_id', id)

  if (summaryError) {
    console.error('[together/summaries/approve] DB error:', summaryError.message)
    return NextResponse.json({ error: 'Failed to approve summary.' }, { status: 500 })
  }

  // Determine next stage
  // person_a approved → switch to person_b_sharing (same round if first time person_b,
  //   or person_b already went this round → sharing_confirmation / next round depends on context)
  // person_b approved → check if both want to continue or move to sharing_confirmation
  let nextStage: string
  let nextSpeaker: string | null = null
  let nextRound = session.round_number

  if (session.stage === 'person_a_summary_review') {
    // Person A reviewed → show Person B their summary on same device
    nextStage = 'person_b_summary_review'
    nextSpeaker = null
  } else {
    // Both summaries reviewed → let both confirm they feel heard before moving on
    nextStage = 'sharing_confirmation'
    nextSpeaker = null
  }

  await db
    .from('together_sessions')
    .update({ stage: nextStage, current_speaker: nextSpeaker, round_number: nextRound })
    .eq('id', id)

  await db.from('audit_events').insert({
    case_id: session.case_id,
    event_type: `together_summary_approved`,
    metadata: { stage: session.stage, round: session.round_number },
  })

  return NextResponse.json({ nextStage, nextSpeaker, nextRound })
}
