import type { Metadata } from 'next'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'
import { StartConversationForm } from './StartConversationForm'

export const metadata: Metadata = {
  title: 'Start a Conversation — Common Ground',
  robots: { index: false },
}

export default function StartPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader exitHref="/" />
      <main className="flex-grow">
        <div className="px-margin-mobile pt-stack-md pb-stack-sm md:max-w-xl mx-auto text-center">
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-2">
            New Facilitation
          </h1>
          <p className="text-on-surface-variant font-body-md">
            Take the first step toward a constructive dialogue. Your information is encrypted and
            kept private between you and the AI facilitator.
          </p>
        </div>
        <StartConversationForm />
      </main>
      <SiteFooter />
    </div>
  )
}
