import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import { UnderstandingView } from './UnderstandingView'
import type { DbTogetherSession, DbTogetherIssue } from '@/lib/db/types'

export const metadata: Metadata = {
  title: 'Shared Understanding — Urushi Labs',
  robots: { index: false },
}

export default async function UnderstandingPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params

  const user = await getUser()
  if (!user) redirect(`/auth?next=/together/${reference}/understanding`)

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

  const validStages = ['sharing_confirmation', 'shared_understanding', 'issue_discussion', 'final_agreement', 'completed']
  if (!validStages.includes(session.stage)) {
    redirect(`/together/${reference}/session`)
  }

  if (session.stage === 'completed') redirect(`/together/${reference}/final`)

  const { data: issues } = await db
    .from('together_issues')
    .select('*')
    .eq('session_id', session.id)
    .order('priority')

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader userEmail={user.email} logoHref="/" />
      <UnderstandingView
        session={session as DbTogetherSession}
        caseReference={reference}
        initialIssues={(issues ?? []) as DbTogetherIssue[]}
      />
      <SiteFooter />
    </div>
  )
}
