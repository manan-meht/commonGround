import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { TogetherReadinessSchema } from '@/lib/validation/schemas'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = TogetherReadinessSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { speaker } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const db = getServiceClient()

  const { data: session } = await db
    .from('together_sessions')
    .select('id, stage, person_a_ready_confirmed_at, person_b_ready_confirmed_at, case_id, cases!inner(user_id)')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

  type S = typeof session & { cases: { user_id: string } }
  if ((session as S).cases.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  // Readiness can be confirmed during any sharing/summary stage or sharing_confirmation
  const validStages = [
    'person_a_sharing', 'person_a_summary_review',
    'person_b_sharing', 'person_b_summary_review',
    'sharing_confirmation',
  ]
  if (!validStages.includes(session.stage)) {
    return NextResponse.json({ error: 'Cannot confirm readiness at this stage.' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const updateField = speaker === 'person_a' ? 'person_a_ready_confirmed_at' : 'person_b_ready_confirmed_at'

  await db.from('together_sessions').update({ [updateField]: now }).eq('id', id)

  // Re-fetch to check if both confirmed
  const { data: updated } = await db
    .from('together_sessions')
    .select('person_a_ready_confirmed_at, person_b_ready_confirmed_at')
    .eq('id', id)
    .single()

  const bothReady = !!(updated?.person_a_ready_confirmed_at && updated?.person_b_ready_confirmed_at)

  if (bothReady && session.stage !== 'sharing_confirmation') {
    await db.from('together_sessions').update({ stage: 'sharing_confirmation' }).eq('id', id)
  }

  await db.from('audit_events').insert({
    case_id: session.case_id,
    event_type: `together_${speaker}_ready_confirmed`,
  })

  return NextResponse.json({ bothReady })
}
