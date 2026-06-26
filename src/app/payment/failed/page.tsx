import Link from 'next/link'
import { Suspense } from 'react'
import { SiteFooter } from '@/components/SiteHeader'

function FailedContent() {
  const now = new Date()
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  const dateStr = `Today, ${time}`

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <header className="px-margin-mobile py-4 flex items-center justify-between">
        <Link href="/pricing" className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </Link>
        <span className="font-headline-md text-on-surface">Common Ground</span>
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">lock</span>
      </header>

      <main className="flex-grow flex flex-col items-center px-margin-mobile py-stack-lg text-center">
        {/* Error icon */}
        <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-8">
          <span className="material-symbols-outlined text-error text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
        </div>

        <h1 className="font-headline-lg text-on-surface mb-3">Payment could not be completed</h1>
        <p className="text-on-surface-variant font-body-md max-w-xs mx-auto mb-8">
          No amount has been deducted. Try again or choose another payment method.
        </p>

        {/* Transaction summary */}
        <div className="w-full max-w-sm bg-surface-container-low rounded-2xl border border-outline-variant p-5 mb-8 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Transaction Summary</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">receipt_long</span>
          </div>
          <p className="font-medium text-on-surface mb-4">Mediation Session</p>
          <div className="flex justify-between text-label-md mb-2">
            <span className="text-on-surface-variant">Status</span>
            <span className="text-error font-medium">Failed</span>
          </div>
          <div className="flex justify-between text-label-md mb-4">
            <span className="text-on-surface-variant">Attempted</span>
            <span className="text-on-surface">{dateStr}</span>
          </div>
          <div className="border-t border-outline-variant pt-3 flex justify-between">
            <span className="font-bold text-on-surface">Total Amount</span>
            <span className="font-bold text-on-surface">—</span>
          </div>
        </div>

        <Link
          href="/pricing"
          className="w-full max-w-sm py-4 bg-primary text-on-primary rounded-xl font-bold text-body-lg shadow-md text-center block mb-3"
        >
          Try again
        </Link>
        <Link
          href="/pricing"
          className="w-full max-w-sm py-4 border-2 border-primary text-primary rounded-xl font-bold text-body-lg text-center block mb-6"
        >
          Choose another method
        </Link>
        <p className="text-label-sm text-on-surface-variant">
          Need help?{' '}
          <a href="mailto:support@commonground.com" className="text-primary underline">Contact support</a>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}

export default function PaymentFailedPage() {
  return (
    <Suspense>
      <FailedContent />
    </Suspense>
  )
}
