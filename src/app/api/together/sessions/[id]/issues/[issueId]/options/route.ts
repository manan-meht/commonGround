import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { TogetherOptionSchema } from '@/lib/validation/schemas'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; issueId: string }> }
) {
  const { id, issueId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = TogetherOptionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

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

  const { data: option, error } = await db
    .from('together_issue_options')
    .insert({ issue_id: issueId, session_id: id, ...parsed.data })
    .select('id')
    .single()

  if (error || !option) {
    return NextResponse.json({ error: 'Failed to create option.' }, { status: 500 })
  }

  return NextResponse.json({ optionId: option.id })
}
