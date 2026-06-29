import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'

export default function JoinInvalidPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader logoHref="/" />
      <main className="flex-grow flex items-center justify-center px-6">
        <div className="max-w-sm text-center space-y-4">
          <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-error text-[32px]">link_off</span>
          </div>
          <h1 className="font-headline-md text-on-surface">This link isn&apos;t valid</h1>
          <p className="font-body-md text-on-surface-variant">
            The join link may have expired or already been used. Ask the person who set up the conversation to share it again.
          </p>
          <Link href="/" className="inline-block mt-4 py-3 px-6 bg-secondary text-white rounded-xl font-label-md">
            Go home
          </Link>
        </div>
      </main>
    </div>
  )
}
