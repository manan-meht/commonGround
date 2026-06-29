import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import { FinalReportView } from './FinalReportView'
import type { DbTogetherSession } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Your Agreement — Urushi Labs',
  robots: { index: false },
}

export default async function FinalPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params

  const user = await getUser()
  if (!user) redirect(`/auth?next=/together/${reference}/final`)

  const db = getServiceClient()
  const { data: caseRow } = await db
    .from('cases')
    .select('id, user_id, conversation_mode')
    .eq('public_reference', reference)
    .eq('conversation_mode', 'together')
    .single()

  if (!caseRow || caseRow.user_id !== user.id) redirect('/dashboard')

  const { data: session } = await db
    .from('together_sessions')
    .select('*')
    .eq('case_id', caseRow.id)
    .single()

  if (!session) redirect('/dashboard')

  const validStages = ['final_agreement', 'completed']
  if (!validStages.includes(session.stage) && !session.final_report) {
    redirect(`/together/${reference}/understanding`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader userEmail={user.email} logoHref="/" />
      <FinalReportView
        session={session as DbTogetherSession}
        caseReference={reference}
      />
      <SiteFooter />
    </div>
  )
}
