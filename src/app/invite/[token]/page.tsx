import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { InvitationView } from './InvitationView'

export const metadata: Metadata = {
  title: 'Invitation — Urushi Labs',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  const user = await getUser()

  if (!user) {
    redirect(`/auth?next=/invite/${token}`)
  }

  return <InvitationView token={token} userEmail={user.email ?? null} />
}
