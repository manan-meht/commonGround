import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { getParticipantSession } from '@/lib/auth/togetherParticipantSession'
import { SiteHeader } from '@/components/SiteHeader'
import { SessionView } from './SessionView'
import type { DbTogetherSession, DbTogetherMessage, DbTogetherTurnSummary, DbTogetherIssue } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Together Conversation — Urushi Labs',
  robots: { index: false },
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const db = getServiceClient()

  // Participant cookie takes priority — Person B joining via QR on any device
  const [user, participantSession] = await Promise.all([getUser(), getParticipantSession()])

  let caseRow: { id: string; user_id: string; conversation_mode: string } | null = null
  let viewerSpeaker: 'person_a' | 'person_b' = 'person_a'

  if (participantSession && participantSession.caseReference === reference) {
    const { data } = await db
      .from('cases')
      .select('id, user_id, conversation_mode')
      .eq('id', participantSession.caseId)
      .single()

    if (data) {
      caseRow = data
      viewerSpeaker = 'person_b'
    }
  }

  if (!caseRow && user) {
    const { data } = await db
      .from('cases')
      .select('id, user_id, conversation_mode')
      .eq('public_reference', reference)
      .eq('conversation_mode', 'together')
      .single()

    if (data && data.user_id === user.id) {
      caseRow = data
      viewerSpeaker = 'person_a'
    }
  }

  if (!caseRow) {
    // No valid auth at all — redirect to auth if no cookie either
    if (!user && !participantSession) {
      redirect(`/auth?next=/together/${reference}/session`)
    }
    redirect('/dashboard')
  }

  const { data: session } = await db
    .from('together_sessions')
    .select('*')
    .eq('case_id', caseRow.id)
    .single()

  if (!session) redirect('/dashboard')

  // Person B skips consent — they joined via QR and Person A confirmed for both
  if (session.stage === 'consent' && viewerSpeaker === 'person_a') {
    redirect(`/together/${reference}/consent`)
  }
  if (session.stage === 'completed') redirect(`/together/${reference}/final`)

  const [messagesRes, summariesRes, issuesRes] = await Promise.all([
    db.from('together_messages').select('*').eq('session_id', session.id).order('created_at'),
    db.from('together_turn_summaries').select('*').eq('session_id', session.id).order('round_number'),
    db.from('together_issues').select('*').eq('session_id', session.id).order('priority'),
  ])

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader userEmail={user?.email} logoHref="/" />
      <SessionView
        session={session as DbTogetherSession}
        caseReference={reference}
        messages={(messagesRes.data ?? []) as DbTogetherMessage[]}
        summaries={(summariesRes.data ?? []) as DbTogetherTurnSummary[]}
        issues={(issuesRes.data ?? []) as DbTogetherIssue[]}
        viewerSpeaker={viewerSpeaker}
      />
    </div>
  )
}
