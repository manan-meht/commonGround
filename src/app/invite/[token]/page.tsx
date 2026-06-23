import type { Metadata } from 'next'
import { InvitationView } from './InvitationView'

export const metadata: Metadata = {
  title: 'Invitation — Common Ground',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  return <InvitationView token={token} />
}
