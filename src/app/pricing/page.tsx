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

export default async function PricingPage() {
  const user = await getUser()
  if (!user) redirect('/auth?next=/pricing')

  const credits = await getOrCreateCredits(user.id)

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <SiteHeader userEmail={user.email} />
      <main className="flex-grow">
        <PricingClient
          roomsAvailable={credits.rooms_available}
          followUpsAvailable={credits.follow_ups_available}
          totalRoomsCreated={credits.total_rooms_created}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
