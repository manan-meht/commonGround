import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import { getUser } from '@/lib/supabase/server'
import { BriefReview } from './BriefReview'
import type { InvitationBrief } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Review Invitation — Urushi Labs',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function BriefPage({ params }: PageProps) {
  const { reference } = await params
  const [session, user] = await Promise.all([getSession(), getUser()])

  if (!session || session.caseReference !== reference || session.role !== 'initiator') {
    redirect('/')
  }

  const db = getServiceClient()
  const { data: caseRow } = await db
    .from('cases')
    .select('id, topic, initiator_name, recipient_name, invitation_brief, invitation_brief_approved_at')
    .eq('id', session.caseId)
    .single()

  if (!caseRow) redirect('/')

  // Check participant completed intake
  const { data: participant } = await db
    .from('participants')
    .select('intake_completed_at')
    .eq('id', session.participantId)
    .single()

  if (!participant?.intake_completed_at) {
    redirect(`/case/${reference}/intake`)
  }

  const initialBrief: InvitationBrief | null = caseRow.invitation_brief
    ? (JSON.parse(caseRow.invitation_brief) as InvitationBrief)
    : null

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteHeader userEmail={user?.email} />
      <BriefReview
        caseId={session.caseId}
        caseReference={reference}
        initiatorName={caseRow.initiator_name}
        recipientName={caseRow.recipient_name}
        initialBrief={initialBrief}
        initialApprovedAt={caseRow.invitation_brief_approved_at ?? null}
      />
      <SiteFooter />
    </div>
  )
}
