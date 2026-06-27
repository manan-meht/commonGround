import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { WaitingView } from './WaitingView'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Waiting — Urushi Labs',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function WaitingPage({ params }: PageProps) {
  const { reference } = await params
  const session = await getSession()

  if (!session || session.caseReference !== reference) {
    redirect('/')
  }

  const db = getServiceClient()
  const { data: caseRow } = await db
    .from('cases')
    .select('id, topic, status, initiator_name, recipient_name, invitation_token_hash')
    .eq('id', session.caseId)
    .single()

  if (!caseRow) redirect('/')

  if (['report_ready', 'needs_safety_review'].includes(caseRow.status)) {
    redirect(`/case/${reference}/report`)
  }

  // Count completed participants
  const { count } = await db
    .from('participants')
    .select('id', { count: 'exact', head: true })
    .eq('case_id', session.caseId)
    .not('intake_completed_at', 'is', null)

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  const inviteLink = session.inviteToken
    ? `${appUrl}/invite/${session.inviteToken}`
    : undefined

  const emailSubject = `${caseRow.initiator_name} has invited you to a guided conversation`

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <WaitingView
        caseReference={reference}
        caseId={session.caseId}
        status={caseRow.status}
        topic={caseRow.topic}
        role={session.role}
        initiatorName={caseRow.initiator_name}
        recipientName={caseRow.recipient_name}
        completedCount={count ?? 0}
        inviteLink={inviteLink}
        emailSubject={emailSubject}
      />
      <SiteFooter />
    </div>
  )
}
