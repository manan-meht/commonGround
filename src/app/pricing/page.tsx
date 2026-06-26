import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { getOrCreateCredits } from '@/lib/db/credits'
import { PricingClient } from './PricingClient'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'Plans — Common Ground',
  robots: { index: false },
}

interface PageProps {
  searchParams: Promise<{ followup?: string }>
}

export default async function PricingPage({ searchParams }: PageProps) {
  const user = await getUser()
  if (!user) redirect('/auth?next=/pricing')

  const [credits, { followup }] = await Promise.all([
    getOrCreateCredits(user.id),
    searchParams,
  ])

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteHeader userEmail={user.email} />
      <main className="flex-grow">
        <PricingClient
          roomsAvailable={credits.rooms_available}
          followUpsAvailable={credits.follow_ups_available}
          totalRoomsCreated={credits.total_rooms_created}
          isFollowUp={followup === '1'}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
