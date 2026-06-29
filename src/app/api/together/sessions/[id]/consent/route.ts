import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const db = getServiceClient()

  const { data: session } = await db
    .from('together_sessions')
    .select('id, stage, case_id, cases!inner(user_id)')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

  type S = typeof session & { cases: { user_id: string } }
  if ((session as S).cases.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  if (session.stage !== 'consent') {
    return NextResponse.json({ error: 'Session is not in consent stage.' }, { status: 409 })
  }

  const now = new Date().toISOString()

  const { error } = await db
    .from('together_sessions')
    .update({ stage: 'person_a_sharing', consent_completed_at: now, current_speaker: 'person_a' })
    .eq('id', id)

  if (error) {
    console.error('[POST together/consent] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to record consent.' }, { status: 500 })
  }

  await db.from('audit_events').insert({
    case_id: session.case_id,
    event_type: 'together_consent_completed',
  })

  return NextResponse.json({ stage: 'person_a_sharing' })
}
