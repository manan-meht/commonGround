import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import { FeedbackForm } from './FeedbackForm'

export const metadata: Metadata = {
  title: 'Report Feedback — Common Ground',
  robots: { index: false },
}

interface PageProps {
  params: Promise<{ reference: string }>
}

export default async function FeedbackPage({ params }: PageProps) {
  const { reference } = await params
  const session = await getSession()

  if (!session || session.caseReference !== reference) redirect('/')

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow max-w-2xl mx-auto px-margin-mobile py-stack-lg w-full">
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-2">
          Report Feedback
        </h1>
        <p className="text-on-surface-variant font-body-md mb-stack-lg">
          Your feedback is private and helps improve future facilitations.
        </p>
        <FeedbackForm caseId={session.caseId} caseReference={reference} />
      </main>
      <SiteFooter />
    </div>
  )
}
