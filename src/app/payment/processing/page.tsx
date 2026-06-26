'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ProcessingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId')
  const product = searchParams.get('product')
  const ran = useRef(false)

  useEffect(() => {
    if (!paymentId || ran.current) return
    ran.current = true

    // TODO: Once Razorpay is integrated, this page should receive
    // razorpay_payment_id and razorpay_signature from the Razorpay callback
    // and pass them to /api/payments/verify instead of calling it directly.

    // Stub: auto-verify the payment (simulates successful payment)
    fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId }),
    })
      .then(async (res) => {
        if (res.ok) {
          router.replace(`/payment/success?product=${product ?? ''}`)
        } else {
          router.replace(`/payment/failed?paymentId=${paymentId}`)
        }
      })
      .catch(() => {
        router.replace(`/payment/failed?paymentId=${paymentId}`)
      })
  }, [paymentId, product, router])

  return (
    <div className="flex flex-col min-h-screen bg-surface items-center justify-center px-margin-mobile text-center">
      <div className="mb-12">
        <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-8" />
        <h1 className="font-headline-lg text-on-surface mb-3">Processing your payment</h1>
        <p className="text-on-surface-variant font-body-md max-w-xs mx-auto">
          Please do not close this page. We are securely finalizing your mediation session details.
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-6 text-on-surface-variant text-label-sm">
          <span className="material-symbols-outlined text-[14px]">shield</span>
          Secure Transaction
        </div>
      </div>
    </div>
  )
}

export default function PaymentProcessingPage() {
  return (
    <Suspense>
      <ProcessingContent />
    </Suspense>
  )
}
