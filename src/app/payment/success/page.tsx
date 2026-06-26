import Link from 'next/link'
import { Suspense } from 'react'
import { SiteFooter } from '@/components/SiteHeader'

const PRODUCT_LABELS: Record<string, { title: string; detail: string; icon: string }> = {
  '10_followups': {
    title: 'Your conversation can continue',
    detail: '10 mediator responses have been added to your room',
    icon: 'forum',
  },
  '1_room': {
    title: 'Your new room is ready',
    detail: '1 mediation room has been added to your account',
    icon: 'meeting_room',
  },
  '3_rooms': {
    title: 'Three rooms unlocked',
    detail: '3 mediation rooms have been added to your account',
    icon: 'domain',
  },
}

function SuccessContent({ product }: { product: string }) {
  const info = PRODUCT_LABELS[product] ?? {
    title: 'Payment successful',
    detail: 'Your credits have been added to your account',
    icon: 'check_circle',
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="px-margin-mobile py-4 flex items-center">
        <Link href="/dashboard" className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <span className="ml-3 font-headline-md text-on-surface">Urushi</span>
      </header>

      <main className="flex-grow flex flex-col items-center px-margin-mobile py-stack-lg text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-primary text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>

        <h1 className="font-headline-lg text-on-surface mb-3">{info.title}</h1>
        <p className="text-on-surface-variant font-body-md max-w-xs mx-auto mb-8">{info.detail}</p>

        {/* Stats */}
        <div className="w-full max-w-sm flex gap-3 mb-8">
          <div className="flex-1 bg-surface-container-low rounded-xl border border-outline-variant p-4 text-center">
            <p className="text-label-sm text-on-surface-variant mb-1">Status</p>
            <p className="font-bold text-primary">Active</p>
          </div>
          <div className="flex-1 bg-surface-container-low rounded-xl border border-outline-variant p-4 text-center">
            <p className="text-label-sm text-on-surface-variant mb-1">Receipt</p>
            <p className="font-bold text-on-surface">Email</p>
          </div>
        </div>

        <Link
          href="/start"
          className="w-full max-w-sm py-4 bg-primary text-on-primary rounded-xl font-bold text-body-lg shadow-md text-center block mb-3"
        >
          Start a conversation →
        </Link>
        <Link href="/dashboard" className="text-label-sm text-on-surface-variant">
          Go to my cases
        </Link>

        <p className="text-label-sm text-on-surface-variant mt-6">Payment receipt sent to your email</p>
      </main>

      <SiteFooter />
    </div>
  )
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>
}) {
  const { product = '' } = await searchParams
  return (
    <Suspense>
      <SuccessContent product={product} />
    </Suspense>
  )
}
