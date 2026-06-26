import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/auth/adminSession'
import { getServiceClient } from '@/lib/db/client'
import { ReportView } from '@/app/case/[reference]/report/ReportView'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import type { SharedReport, DbAgreement } from '@/lib/db/types'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminCaseDetailPage({ params }: PageProps) {
  const authed = await isAdminAuthenticated()
  if (!authed) redirect('/admin')

  const { id } = await params
  const db = getServiceClient()

  const { data: caseRow } = await db
    .from('cases')
    .select('id, public_reference, topic, status, initiator_name, recipient_name, input_tokens_used, output_tokens_used, total_tokens_used')
    .eq('id', id)
    .single()

  if (!caseRow) redirect('/admin/cases')

  const { data: analysis } = await db
    .from('analyses')
    .select('structured_result, safety_category, created_at')
    .eq('case_id', id)
    .eq('status', 'complete')
    .single()

  const { data: agreements } = await db
    .from('agreements')
    .select('id, agreement_text, initiator_response, recipient_response')
    .eq('case_id', id)

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center gap-3">
        <Link href="/admin/cases" className="text-primary text-label-sm font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          All cases
        </Link>
        <span className="text-outline-variant">·</span>
        <span className="text-label-sm text-on-surface-variant font-mono">{caseRow.public_reference}</span>
        <span className="text-label-sm text-on-surface-variant">— {caseRow.status}</span>
      </div>

      <div className="mx-4 my-2 flex gap-4 flex-wrap">
        <div className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-label-sm">
          <span className="text-on-surface-variant">Input tokens: </span>
          <span className="font-mono font-medium text-on-surface">{(caseRow.input_tokens_used ?? 0).toLocaleString()}</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-label-sm">
          <span className="text-on-surface-variant">Output tokens: </span>
          <span className="font-mono font-medium text-on-surface">{(caseRow.output_tokens_used ?? 0).toLocaleString()}</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2 text-label-sm">
          <span className="text-on-surface-variant">Total tokens: </span>
          <span className="font-mono font-bold text-primary">{(caseRow.total_tokens_used ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {analysis?.structured_result && (
        <details className="mx-4 my-2 border border-outline-variant rounded-lg">
          <summary className="px-4 py-2 text-label-sm text-on-surface-variant cursor-pointer">Raw JSON (debug)</summary>
          <pre className="p-4 text-[11px] overflow-x-auto bg-surface-container-low">{JSON.stringify(analysis.structured_result, null, 2)}</pre>
        </details>
      )}

      {analysis?.structured_result ? (
        <ReportView
          report={analysis.structured_result as SharedReport}
          agreements={(agreements as DbAgreement[]) ?? []}
          caseId={caseRow.id}
          caseReference={caseRow.public_reference}
          role="initiator"
          topic={caseRow.topic}
          initiatorName={caseRow.initiator_name}
          recipientName={caseRow.recipient_name}
          generatedAt={analysis.created_at}
          isAdminView
        />
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px]">hourglass_empty</span>
          <p>No completed report yet. Case status: <strong>{caseRow.status}</strong></p>
          {['ready_for_analysis', 'analysing'].includes(caseRow.status) && (
            <p className="text-label-sm">Analysis is in progress — check back shortly.</p>
          )}
        </div>
      )}
      <SiteFooter />
    </div>
  )
}
