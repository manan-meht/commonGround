import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { IntakeChat } from './IntakeChat'

export const metadata: Metadata = {
  title: 'Private Intake — Common Ground',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function IntakePage({ params }: PageProps) {
  const { reference } = await params
  const session = await getSession()

  if (!session || session.caseReference !== reference) {
    redirect('/')
  }

  const db = getServiceClient()
  const { data: caseRow } = await db
    .from('cases')
    .select('topic, initiator_name, recipient_name')
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

  return (
    <IntakeChat
      caseReference={reference}
      caseId={session.caseId}
      topic={caseRow.topic}
      participantName={participantName}
      otherPartyName={otherPartyName}
      role={session.role}
    />
  )
}
