import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import { StartConversationForm } from './StartConversationForm'
import { getUser } from '@/lib/supabase/server'
import { getOrCreateCredits } from '@/lib/db/credits'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Start a Conversation — Urushi Labs',
  robots: { index: false },
}

export default async function StartPage() {
  const user = await getUser()
  if (!user) redirect('/auth?next=/start')

  const credits = await getOrCreateCredits(user.id)
  const hasCredits = credits.rooms_available > 0

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader exitHref="/" userEmail={user.email} />
      <main className="flex-grow">
        <div className="px-margin-mobile pt-stack-md pb-stack-sm md:max-w-xl mx-auto text-center">
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-2">
            New Facilitation
          </h1>
          <p className="text-on-surface-variant font-body-md">
            Take the first step toward a constructive dialogue. Your information is encrypted and
            kept private between you and the AI facilitator.
          </p>
          {credits.rooms_available > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-primary-container/20 text-primary rounded-full px-3 py-1 text-label-sm">
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              {credits.rooms_available} room{credits.rooms_available !== 1 ? 's' : ''} available
            </div>
          )}
        </div>

        {hasCredits ? (
          <StartConversationForm />
        ) : (
          <div className="max-w-md mx-auto px-margin-mobile py-stack-md text-center">
            <div className="bg-surface-container-low rounded-2xl border border-outline-variant p-8 flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>meeting_room</span>
              <h2 className="font-headline-md text-on-surface">No rooms available</h2>
              <p className="text-on-surface-variant font-body-md">
                You have used your free mediation room. Purchase a plan to start more conversations.
              </p>
              <Link
                href="/pricing"
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-body-lg shadow-md text-center block"
              >
                View plans
              </Link>
              <Link href="/dashboard" className="text-label-sm text-on-surface-variant">
                Back to my cases
              </Link>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
