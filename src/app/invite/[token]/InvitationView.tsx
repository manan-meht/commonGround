'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SiteHeader, SiteFooter } from '@/components/SiteHeader'

interface InviteData {
  topic: string
  initiatorName: string
  recipientName: string
  caseReference: string
}

export function InvitationView({ token }: { token: string }) {
  const router = useRouter()
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json() as InviteData & { error?: string }
        if (!res.ok) {
          setError(data.error ?? 'This invitation is not available.')
        } else {
          setInviteData(data)
        }
      })
      .catch(() => setError('Failed to load invitation.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleAccept() {
    setAccepting(true)
    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json() as { caseReference?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to accept invitation.')
        setAccepting(false)
        return
      }
      if (data.caseReference) {
        router.push(`/case/${data.caseReference}/intake`)
      }
    } catch {
      setError('A network error occurred. Please try again.')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-on-surface-variant">Loading invitation…</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-grow flex items-center justify-center px-margin-mobile">
          <div className="max-w-md text-center">
            <span className="material-symbols-outlined text-error text-5xl mb-4">error</span>
            <h1 className="font-headline-md text-on-surface mb-2">Invitation unavailable</h1>
            <p className="text-on-surface-variant font-body-md">{error}</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  if (!inviteData) return null

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow">
        {/* Hero */}
        <section className="relative px-margin-mobile pt-stack-md pb-stack-lg overflow-hidden">
          <div className="relative z-10 max-w-container-max mx-auto text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-base shadow-ambient">
              <span className="material-symbols-outlined text-white text-4xl">mail</span>
            </div>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-stack-sm">
              You&apos;ve been invited…
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto">
              <strong>{inviteData.initiatorName}</strong> would like to reach a resolution with you.
            </p>
          </div>
        </section>

        {/* Topic card */}
        <section className="px-margin-mobile -mt-stack-lg pb-stack-md">
          <div className="max-w-md mx-auto bg-surface-container-lowest rounded-xl p-stack-md shadow-ambient border border-outline-variant">
            <div className="flex items-center gap-base mb-stack-sm">
              <span className="material-symbols-outlined text-secondary">forum</span>
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">The Topic</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-base">
              {inviteData.topic}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {inviteData.initiatorName} is seeking your perspective to ensure mutual understanding and
              find a constructive path forward.
            </p>
          </div>
        </section>

        {/* Privacy + how it works */}
        <section className="px-margin-mobile py-stack-md">
          <div className="max-w-md mx-auto grid grid-cols-1 gap-base">
            <div className="bg-secondary-container/30 rounded-xl p-stack-sm flex gap-stack-sm border border-secondary-container">
              <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
              <div>
                <h3 className="font-label-md text-label-md text-on-secondary-container font-bold">Privacy Guaranteed</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  You cannot see {inviteData.initiatorName}&apos;s raw input, and they cannot see yours. The AI
                  facilitator analyses both perspectives independently to find common ground.
                </p>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-xl p-stack-sm">
              <h3 className="font-label-sm text-label-sm text-outline uppercase mb-stack-sm px-base">How it works</h3>
              <div className="space-y-4 px-base">
                {[
                  'You share your perspective privately with the AI.',
                  'The facilitator identifies shared goals and tensions.',
                  'A collaborative resolution plan is generated for both of you.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-stack-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="font-label-md text-label-md text-on-surface">{i + 1}</span>
                    </div>
                    <p className="font-body-md text-body-md text-on-surface-variant pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Safety notice */}
        <section className="px-margin-mobile pb-stack-lg">
          <div className="max-w-md mx-auto bg-error-container/20 border border-error-container rounded-xl p-4 flex gap-3">
            <span className="material-symbols-outlined text-error shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <div>
              <p className="font-label-sm text-on-error-container font-bold uppercase mb-1">Safety Notice</p>
              <p className="font-body-md text-[14px] text-on-error-container/80 leading-tight">
                Urushi Labs is an AI communication tool, not a substitute for legal advice or
                professional support. If you feel unsafe, please contact emergency services immediately.
                You can learn more on our <a href="/safety" className="underline">safety page</a>.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 bg-surface/90 backdrop-blur-md px-margin-mobile py-stack-md border-t border-outline-variant/30">
        <div className="max-w-md mx-auto flex flex-col gap-base">
          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary py-4 rounded-xl font-label-md text-label-md font-bold shadow-ambient transition-all transform active:scale-95 disabled:opacity-60"
          >
            {accepting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Initialising safe space…
              </span>
            ) : 'Share my perspective'}
          </button>
          <a href="/safety" className="text-center w-full text-secondary py-3 font-label-md text-label-md hover:bg-secondary/5 rounded-xl transition-colors">
            Learn more about safety
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
