'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RATINGS = [
  { value: 'accurately', label: 'I feel represented accurately', icon: 'sentiment_satisfied' },
  { value: 'partly', label: 'I feel partly represented', icon: 'sentiment_neutral' },
  { value: 'not', label: 'I do not feel represented', icon: 'sentiment_dissatisfied' },
]

export function FeedbackForm({ caseId, caseReference }: { caseId: string; caseReference: string }) {
  const router = useRouter()
  const [rating, setRating] = useState<string>('')
  const [correction, setCorrection] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [readyToTalk, setReadyToTalk] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/cases/${caseId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          representationRating: rating,
          freeTextCorrection: correction || undefined,
          mostUsefulRecommendation: recommendation || undefined,
          readyToTalkDirectly: readyToTalk ?? false,
        }),
      })

      if (res.ok) {
        setDone(true)
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to submit feedback.')
      }
    } catch {
      setError('A network error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-primary-container/20 p-8 rounded-xl text-center">
        <span className="material-symbols-outlined text-primary text-4xl mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
        <h2 className="font-headline-md text-on-surface mb-2">Thank you for your feedback</h2>
        <p className="text-on-surface-variant mb-6">Your response has been recorded privately.</p>
        <button
          onClick={() => router.push(`/case/${caseReference}/report`)}
          className="bg-primary text-white px-8 py-3 rounded-xl font-label-md"
        >
          Back to report
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl" role="alert">{error}</div>
      )}

      <div className="space-y-3">
        <h2 className="font-label-sm text-primary uppercase tracking-widest">How do you feel represented?</h2>
        {RATINGS.map((r) => (
          <label key={r.value} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-outline-variant cursor-pointer hover:border-primary transition-colors">
            <input
              type="radio"
              name="rating"
              value={r.value}
              checked={rating === r.value}
              onChange={() => setRating(r.value)}
              className="text-primary focus:ring-primary"
            />
            <span className="material-symbols-outlined text-on-surface-variant">{r.icon}</span>
            <span className="font-body-md text-on-surface">{r.label}</span>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="correction" className="font-label-md text-on-surface-variant">
          What would you correct or add? (optional)
        </label>
        <textarea
          id="correction"
          value={correction}
          onChange={(e) => setCorrection(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Describe anything you feel was missed or misrepresented…"
          className="w-full p-4 bg-white border border-outline-variant rounded-xl focus:border-secondary outline-none resize-none font-body-md"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="recommendation" className="font-label-md text-on-surface-variant">
          Which recommendation was most useful? (optional)
        </label>
        <textarea
          id="recommendation"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full p-4 bg-white border border-outline-variant rounded-xl focus:border-secondary outline-none resize-none font-body-md"
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-label-sm text-primary uppercase tracking-widest">Readiness to talk directly</h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="readyToTalk"
              checked={readyToTalk === true}
              onChange={() => setReadyToTalk(true)}
              className="text-primary focus:ring-primary"
            />
            <span className="font-body-md text-on-surface">Yes, I&apos;m ready</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="readyToTalk"
              checked={readyToTalk === false}
              onChange={() => setReadyToTalk(false)}
              className="text-primary focus:ring-primary"
            />
            <span className="font-body-md text-on-surface">Not yet</span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={!rating || submitting}
        className="w-full py-4 bg-primary text-white rounded-xl font-bold disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit feedback'}
      </button>
    </form>
  )
}
