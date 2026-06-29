import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { TogetherOptionResponseSchema } from '@/lib/validation/schemas'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; issueId: string; optionId: string }> }
) {
  const { id, optionId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = TogetherOptionResponseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { speaker, response, note } = parsed.data

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const db = getServiceClient()

  const { data: session } = await db
    .from('together_sessions')
    .select('id, cases!inner(user_id)')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

  type S = typeof session & { cases: { user_id: string } }
  if ((session as S).cases.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const updateField = speaker === 'person_a'
    ? { person_a_response: response, person_a_note: note ?? null }
    : { person_b_response: response, person_b_note: note ?? null }

  const { error } = await db
    .from('together_issue_options')
    .update(updateField)
    .eq('id', optionId)
    .eq('session_id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to record response.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
