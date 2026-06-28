import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getUser } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { IntakeChat } from './IntakeChat'
import { buildPartyBOpeningMessage } from '@/lib/ai/invitationBrief'
import type { InvitationBrief } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Private Intake — Urushi Labs',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function IntakePage({ params }: PageProps) {
  const { reference } = await params
  const [session, supabaseUser] = await Promise.all([getSession(), getUser()])

  if (!session || session.caseReference !== reference) {
    redirect('/')
  }

  const db = getServiceClient()
  const { data: caseRow } = await db
    .from('cases')
    .select('topic, initiator_name, recipient_name, invitation_brief, invitation_brief_approved_at')
    .eq('id', session.caseId)
    .single()

  if (!caseRow) redirect('/')

  const otherPartyName =
    session.role === 'initiator' ? caseRow.recipient_name : caseRow.initiator_name
  const participantName =
    session.role === 'initiator' ? caseRow.initiator_name : caseRow.recipient_name

  // Check if already complete
  const { data: participant } = await db
    .from('participants')
    .select('intake_completed_at')
    .eq('id', session.participantId)
    .single()

  if (participant?.intake_completed_at) {
    redirect(`/case/${reference}/waiting`)
  }

  // Build context-aware opening for Party B if a brief exists
  let openingMessage: string | undefined
  if (session.role === 'recipient' && caseRow.invitation_brief) {
    try {
      const brief = JSON.parse(caseRow.invitation_brief) as InvitationBrief
      openingMessage = buildPartyBOpeningMessage(brief, participantName)
    } catch {
      // Fall back to generic opening if parse fails
    }
  }

  return (
    <IntakeChat
      caseReference={reference}
      caseId={session.caseId}
      topic={caseRow.topic}
      participantName={participantName}
      otherPartyName={otherPartyName}
      role={session.role}
      isLoggedIn={!!supabaseUser}
      openingMessage={openingMessage}
    />
  )
}
