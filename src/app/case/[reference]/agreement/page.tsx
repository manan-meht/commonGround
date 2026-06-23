import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { AgreementForm } from './AgreementForm'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import type { DbAgreement } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Agreements — Common Ground',
  robots: { index: false },
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function AgreementPage({ params }: PageProps) {
  const { reference } = await params
  const session = await getSession()

  if (!session || session.caseReference !== reference) redirect('/')

  const db = getServiceClient()
  const { data: agreements } = await db
    .from('agreements')
    .select('id, agreement_text, initiator_response, recipient_response, initiator_note, recipient_note')
    .eq('case_id', session.caseId)

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow max-w-2xl mx-auto px-margin-mobile py-stack-lg w-full">
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-2">
          Proposed Agreements
        </h1>
        <p className="text-on-surface-variant font-body-md mb-stack-lg">
          Respond to each proposed commitment independently. Neither party can see the other&apos;s
          response until both have submitted.
        </p>
        <AgreementForm
          agreements={(agreements as DbAgreement[]) ?? []}
          role={session.role}
          caseId={session.caseId}
          caseReference={reference}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
