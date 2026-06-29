import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/db/client'
import { verifyTogetherAccess } from '@/lib/together/verifyAccess'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const access = await verifyTogetherAccess(id)
  if (!access) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const db = getServiceClient()

  const { data: session } = await db
    .from('together_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

  const [messagesRes, summariesRes, issuesRes] = await Promise.all([
    db.from('together_messages').select('*').eq('session_id', id).order('created_at'),
    db.from('together_turn_summaries').select('*').eq('session_id', id).order('round_number'),
    db.from('together_issues').select('*, together_issue_options(*)').eq('session_id', id).order('priority'),
  ])

  return NextResponse.json({
    session,
    messages: messagesRes.data ?? [],
    summaries: summariesRes.data ?? [],
    issues: issuesRes.data ?? [],
  })
}
