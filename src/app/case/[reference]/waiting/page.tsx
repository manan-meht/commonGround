import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { WaitingView } from './WaitingView'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import { buildWhatsAppShareUrl } from '@/lib/notifications/whatsapp'

export const metadata: Metadata = {
  title: 'Waiting — Common Ground',
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
    .select('id, topic, status, initiator_name, recipient_name, recipient_phone, invitation_token_hash')
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

  // Build invite link — we need to find the invite token
  // For the waiting page, if this is the initiator we show the share link
  // We reconstruct the link from the case reference (token not stored plaintext)
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'

  // The invite link is shown to the initiator; we can't reconstruct the token but
  // we can build the WhatsApp message pointing to a token lookup
  // For demo: derive from a stored URL or show a placeholder
  // In production, the token was returned at case creation time
  const inviteLink = `${appUrl}/invite/[your-invite-link]`

  const whatsAppUrl =
    session.role === 'initiator'
      ? buildWhatsAppShareUrl({
          recipientPhone: caseRow.recipient_phone,
          initiatorName: caseRow.initiator_name,
          topic: caseRow.topic,
          inviteLink,
        })
      : undefined

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <WaitingView
        caseReference={reference}
        caseId={session.caseId}
        status={caseRow.status}
        topic={caseRow.topic}
        role={session.role}
        recipientName={caseRow.recipient_name}
        completedCount={count ?? 0}
        whatsAppUrl={whatsAppUrl}
      />
      <SiteFooter />
    </div>
  )
}
