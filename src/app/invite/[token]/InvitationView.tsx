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

  const { initiatorName, topic } = inviteData

  const reassurances = [
    `Joining does not mean you agree with ${initiatorName}.`,
    'Your raw responses will not be shown to the other participant.',
    'Urushi Labs does not automatically assume the person who started the conversation is correct.',
    'You will be able to review the summary of your perspective before submitting it.',
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow">

        {/* Hero */}
        <section className="px-margin-mobile pt-stack-md pb-stack-sm">
          <div className="max-w-md mx-auto text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-base shadow-ambient">
              <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
            </div>
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface mb-stack-sm">
              {initiatorName} has invited you to a guided conversation
            </h1>
          </div>
        </section>

        {/* Topic */}
        <section className="px-margin-mobile pb-stack-md">
          <div className="max-w-md mx-auto bg-surface-container-lowest rounded-xl p-stack-md shadow-ambient border border-outline-variant">
            <p className="font-label-sm text-outline uppercase tracking-widest mb-2">Conversation topic</p>
            <p className="font-headline-md text-headline-md text-on-surface">{topic}</p>
          </div>
        </section>

        {/* What Urushi does */}
        <section className="px-margin-mobile pb-stack-md">
          <div className="max-w-md mx-auto space-y-3">
            <p className="font-body-md text-on-surface-variant">
              Urushi Labs gives each person an equal opportunity to share their perspective privately before preparing a shared report.
            </p>

            <div className="bg-surface-container-low rounded-xl p-5 space-y-3">
              {reassurances.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <p className="font-body-md text-on-surface-variant">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-margin-mobile pb-stack-lg">
          <div className="max-w-md mx-auto bg-surface-container-low rounded-xl p-stack-sm">
            <h3 className="font-label-sm text-outline uppercase mb-stack-sm px-base tracking-widest">How it works</h3>
            <div className="space-y-4 px-base">
              {[
                'You share your perspective privately with the AI — the other person does not see what you write.',
                'The AI facilitator reviews both accounts independently.',
                'A shared report is prepared for both of you to read together.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-stack-sm">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="font-label-md text-label-md text-on-surface">{i + 1}</span>
                  </div>
                  <p className="font-body-md text-on-surface-variant pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Safety notice */}
        <section className="px-margin-mobile pb-stack-lg">
          <div className="max-w-md mx-auto bg-error-container/20 border border-error-container rounded-xl p-4 flex gap-3">
            <span className="material-symbols-outlined text-error shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <p className="font-body-md text-[14px] text-on-error-container/80 leading-tight">
              Urushi Labs is an AI communication tool, not a substitute for legal advice or professional support. If you feel unsafe, please contact emergency services or visit our{' '}
              <a href="/safety" className="underline">safety page</a>.
            </p>
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
                Setting up your private space…
              </span>
            ) : 'Share my perspective privately'}
          </button>
          <a
            href="/safety"
            className="text-center w-full text-secondary py-3 font-label-md text-label-md hover:bg-secondary/5 rounded-xl transition-colors"
          >
            How does this work?
          </a>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
