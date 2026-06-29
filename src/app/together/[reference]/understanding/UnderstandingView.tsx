'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { DbTogetherSession, DbTogetherIssue, TogetherSharedUnderstanding } from '@/lib/db/types'

interface Props {
  session: DbTogetherSession
  caseReference: string
  initialIssues: DbTogetherIssue[]
}

export function UnderstandingView({ session, caseReference, initialIssues }: Props) {
  const router = useRouter()
  const [understanding, setUnderstanding] = useState<TogetherSharedUnderstanding | null>(
    session.shared_understanding
  )
  const [issues, setIssues] = useState(initialIssues)
  const [generating, setGenerating] = useState(!session.shared_understanding)
  const [error, setError] = useState('')
  const [completing, setCompleting] = useState(false)

  const sid = session.id

  useEffect(() => {
    if (!understanding) {
      void generateUnderstanding()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function generateUnderstanding() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/together/sessions/${sid}/understanding`, { method: 'POST' })
      const data = await res.json() as { understanding?: TogetherSharedUnderstanding; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate shared understanding.')
        return
      }
      setUnderstanding(data.understanding ?? null)

      // Reload issues from server (they were inserted by the API)
      const sessionRes = await fetch(`/api/together/sessions/${sid}`)
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json() as { issues: DbTogetherIssue[] }
        setIssues(sessionData.issues ?? [])
      }
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleComplete() {
    setCompleting(true)
    try {
      const res = await fetch(`/api/together/sessions/${sid}/complete`, { method: 'POST' })
      const data = await res.json() as { report?: unknown; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate final report.')
        return
      }
      router.push(`/together/${caseReference}/final`)
    } catch {
      setError('A network error occurred.')
    } finally {
      setCompleting(false)
    }
  }

  if (generating) {
    return (
      <main className="flex-grow flex items-center justify-center flex-col gap-4 px-margin-mobile py-stack-lg">
        <svg className="animate-spin h-10 w-10 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="font-body-md text-on-surface-variant">Urushi is preparing your shared understanding…</p>
      </main>
    )
  }

  if (error && !understanding) {
    return (
      <main className="flex-grow flex items-center justify-center flex-col gap-4 px-margin-mobile py-stack-lg max-w-md mx-auto">
        <span className="material-symbols-outlined text-error text-[48px]">error</span>
        <p className="font-body-md text-on-surface-variant text-center">{error}</p>
        <button
          onClick={() => void generateUnderstanding()}
          className="py-3 px-6 bg-secondary text-white rounded-xl font-bold font-label-md"
        >
          Try again
        </button>
      </main>
    )
  }

  return (
    <main className="flex-grow w-full max-w-2xl mx-auto px-margin-mobile pt-stack-md pb-stack-lg space-y-8">

      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-secondary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
        </div>
        <h1 className="font-headline-md text-on-surface mb-2">Shared Understanding</h1>
        <p className="font-body-md text-on-surface-variant">Urushi has summarised what each of you shared.</p>
      </div>

      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl" role="alert">{error}</div>
      )}

      {understanding && (
        <>
          {/* Person A summary */}
          <section aria-label={`${session.person_a_name}'s perspective`}>
            <h2 className="font-label-sm text-outline uppercase tracking-widest mb-3">
              What {session.person_a_name} wants understood
            </h2>
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
              <p className="font-body-md text-on-surface leading-relaxed">{understanding.personASummary}</p>
            </div>
          </section>

          {/* Person B summary */}
          <section aria-label={`${session.person_b_name}'s perspective`}>
            <h2 className="font-label-sm text-outline uppercase tracking-widest mb-3">
              What {session.person_b_name} wants understood
            </h2>
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
              <p className="font-body-md text-on-surface leading-relaxed">{understanding.personBSummary}</p>
            </div>
          </section>

          {/* Agreements */}
          {understanding.agreements.length > 0 && (
            <section aria-label="What you already agree on">
              <h2 className="font-label-sm text-outline uppercase tracking-widest mb-3">What you already agree on</h2>
              <div className="space-y-3">
                {understanding.agreements.map((a, i) => (
                  <div key={i} className="bg-primary-container/20 rounded-xl border border-primary/20 p-4 flex gap-3">
                    <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <div>
                      <p className="font-label-md text-on-surface font-semibold">{a.title}</p>
                      <p className="font-body-md text-on-surface-variant text-sm">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Differences */}
          {understanding.differences.length > 0 && (
            <section aria-label="Where your perspectives differ">
              <h2 className="font-label-sm text-outline uppercase tracking-widest mb-3">Where your perspectives differ</h2>
              <div className="space-y-4">
                {understanding.differences.map((d, i) => (
                  <div key={i} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 space-y-3">
                    <p className="font-label-md text-on-surface font-semibold">{d.title}</p>
                    <p className="font-body-md text-on-surface-variant text-sm italic">{d.neutralDescription}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="bg-surface-container-low rounded-lg p-3">
                        <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">{session.person_a_name}</p>
                        <p className="font-body-md text-on-surface text-sm">{d.personAPerspective}</p>
                      </div>
                      <div className="bg-surface-container-low rounded-lg p-3">
                        <p className="font-label-sm text-outline text-[11px] uppercase tracking-widest mb-1">{session.person_b_name}</p>
                        <p className="font-body-md text-on-surface text-sm">{d.personBPerspective}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Issues to resolve */}
          {issues.length > 0 && (
            <section aria-label="Issues to resolve">
              <h2 className="font-label-sm text-outline uppercase tracking-widest mb-3">Issues to resolve</h2>
              <div className="space-y-3">
                {issues.map((issue, i) => (
                  <div key={issue.id} className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                      <span className="font-label-md text-on-surface">{i + 1}</span>
                    </div>
                    <div>
                      <p className="font-label-md text-on-surface font-semibold">{issue.title}</p>
                      <p className="font-body-md text-on-surface-variant text-sm">{issue.neutral_description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA */}
      <div className="pt-4 space-y-3">
        <button
          onClick={() => void handleComplete()}
          disabled={completing || !understanding}
          className="w-full py-4 bg-secondary text-white rounded-xl font-bold font-label-md transition-all active:scale-95 disabled:opacity-60 shadow-sm"
        >
          {completing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Generating final report…
            </span>
          ) : 'Generate our final agreement →'}
        </button>
        <p className="text-center text-label-sm text-outline">
          This will create a summary of what you agreed, what remains open, and suggested next steps.
        </p>
      </div>
    </main>
  )
}
