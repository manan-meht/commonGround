import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  awaiting_initiator: 'Setting up',
  awaiting_recipient: 'Waiting for other party',
  ready_for_analysis: 'Processing',
  analysing: 'Generating report',
  report_ready: 'Report ready',
  needs_safety_review: 'Under review',
}

const STATUS_COLOR: Record<string, string> = {
  awaiting_initiator: 'bg-outline-variant/40 text-on-surface-variant',
  awaiting_recipient: 'bg-secondary-container text-on-secondary-container',
  ready_for_analysis: 'bg-tertiary-container/60 text-on-tertiary-container',
  analysing: 'bg-tertiary-container/60 text-on-tertiary-container',
  report_ready: 'bg-primary-container text-on-primary-container',
  needs_safety_review: 'bg-error-container text-on-error-container',
}

const STATUS_ICON: Record<string, string> = {
  awaiting_initiator: 'pending',
  awaiting_recipient: 'hourglass_empty',
  ready_for_analysis: 'sync',
  analysing: 'psychology',
  report_ready: 'check_circle',
  needs_safety_review: 'warning',
}

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/auth')

  const db = getServiceClient()

  // Fetch cases where user is the initiator or a participant
  const { data: cases } = await db
    .from('cases')
    .select('id, public_reference, topic, status, initiator_name, recipient_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const displayName = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'there'

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteHeader />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline-md text-on-surface">Hi, {displayName}</h1>
            <p className="text-on-surface-variant font-body-md">Your conversations</p>
          </div>
          <Link
            href="/start"
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-label-md shadow-sm hover:bg-on-primary-fixed-variant transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            New
          </Link>
        </div>

        {/* Cases list */}
        {cases && cases.length > 0 ? (
          <div className="flex flex-col gap-3">
            {cases.map((c) => {
              const isReady = ['report_ready', 'needs_safety_review'].includes(c.status)
              const isActive = ['awaiting_recipient', 'ready_for_analysis', 'analysing'].includes(c.status)
              const href = isReady
                ? `/case/${c.public_reference}/report`
                : isActive
                  ? `/case/${c.public_reference}/waiting`
                  : `/case/${c.public_reference}/intake`

              return (
                <Link
                  key={c.id}
                  href={href}
                  className="bg-white border border-outline-variant/40 rounded-2xl p-5 flex items-start gap-4 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${STATUS_COLOR[c.status] ?? 'bg-outline-variant/40 text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {STATUS_ICON[c.status] ?? 'chat'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-on-surface font-semibold truncate">{c.topic}</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      With {c.recipient_name} · {new Date(c.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`text-label-sm px-2.5 py-1 rounded-full font-medium shrink-0 ${STATUS_COLOR[c.status] ?? ''}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 bg-primary-container/30 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </div>
            <h2 className="font-headline-sm text-on-surface">No conversations yet</h2>
            <p className="text-on-surface-variant font-body-md max-w-xs">
              Start your first conversation to begin working through a disagreement constructively.
            </p>
            <Link
              href="/start"
              className="mt-2 bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-on-primary-fixed-variant transition-all active:scale-95"
            >
              Start a conversation
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
