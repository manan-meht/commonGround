import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { ReportView } from './ReportView'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import type { SharedReport, DbAgreement } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Shared Report — Common Ground',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function ReportPage({ params }: PageProps) {
  const { reference } = await params
  const session = await getSession()

  if (!session || session.caseReference !== reference) {
    redirect('/')
  }

  const db = getServiceClient()
  const { data: caseRow } = await db
    .from('cases')
    .select('status, topic, initiator_name, recipient_name')
    .eq('id', session.caseId)
    .single()

  if (!caseRow) redirect('/')

  if (!['report_ready', 'needs_safety_review'].includes(caseRow.status)) {
    redirect(`/case/${reference}/waiting`)
  }

  const { data: analysis } = await db
    .from('analyses')
    .select('structured_result, safety_category, created_at')
    .eq('case_id', session.caseId)
    .eq('status', 'complete')
    .single()

  if (!analysis?.structured_result) {
    redirect(`/case/${reference}/waiting`)
  }

  const { data: agreements } = await db
    .from('agreements')
    .select('id, agreement_text, initiator_response, recipient_response')
    .eq('case_id', session.caseId)

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <ReportView
        report={analysis.structured_result as SharedReport}
        agreements={(agreements as DbAgreement[]) ?? []}
        caseId={session.caseId}
        caseReference={reference}
        role={session.role}
        topic={caseRow.topic}
        initiatorName={caseRow.initiator_name}
        recipientName={caseRow.recipient_name}
        generatedAt={analysis.created_at}
      />
      <SiteFooter />
    </div>
  )
}
