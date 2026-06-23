'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { DbAgreement, AgreementResponse } from '@/lib/db/types'

const RESPONSE_OPTIONS: { value: AgreementResponse; label: string; icon: string }[] = [
  { value: 'agreed', label: 'I agree', icon: 'check_circle' },
  { value: 'needs_modification', label: 'Needs modification', icon: 'edit' },
  { value: 'not_agreed', label: 'I don\'t agree', icon: 'cancel' },
]

interface Props {
  agreements: DbAgreement[]
  role: 'initiator' | 'recipient'
  caseId: string
  caseReference: string
}

export function AgreementForm({ agreements, role, caseReference }: Props) {
  const router = useRouter()
  const [responses, setResponses] = useState<Record<string, { response: AgreementResponse; note: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<string[]>([])
  const [error, setError] = useState('')

  function getMyResponse(a: DbAgreement): AgreementResponse | null {
    return role === 'initiator' ? a.initiator_response : a.recipient_response
  }

  async function submitResponse(agreementId: string) {
    const resp = responses[agreementId]
    if (!resp?.response) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/cases/${caseReference}/agreement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreementId, response: resp.response, note: resp.note || undefined }),
      })

      if (res.ok) {
        setSubmitted((prev) => [...prev, agreementId])
      } else {
        const data = await res.json() as { error?: string }
        setError(data.error ?? 'Failed to submit response.')
      }
    } catch {
      setError('A network error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (agreements.length === 0) {
    return (
      <div className="text-center py-stack-lg">
        <p className="text-on-surface-variant">No proposed agreements have been generated yet.</p>
        <button
          onClick={() => router.push(`/case/${caseReference}/report`)}
          className="mt-4 text-primary font-label-md underline"
        >
          Back to report
        </button>
      </div>
    )
  }

  const allSubmitted = agreements.every(
    (a) => submitted.includes(a.id) || getMyResponse(a) !== null
  )

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl font-body-md" role="alert">
          {error}
        </div>
      )}

      {agreements.map((a) => {
        const alreadyResponded = submitted.includes(a.id) || getMyResponse(a) !== null
        const myResponse = getMyResponse(a)

        return (
          <div key={a.id} className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant">
            <p className="font-body-md text-on-surface mb-4">{a.agreement_text}</p>

            {alreadyResponded ? (
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">check_circle</span>
                <p className="font-label-md">Response submitted: <strong>{myResponse ?? responses[a.id]?.response}</strong></p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {RESPONSE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setResponses((prev) => ({
                        ...prev,
                        [a.id]: { response: opt.value, note: prev[a.id]?.note ?? '' },
                      }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-label-md transition-all border ${
                        responses[a.id]?.response === opt.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-on-surface-variant border-outline-variant hover:border-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>

                {responses[a.id]?.response === 'needs_modification' && (
                  <textarea
                    value={responses[a.id]?.note ?? ''}
                    onChange={(e) => setResponses((prev) => ({
                      ...prev,
                      [a.id]: { ...prev[a.id]!, note: e.target.value },
                    }))}
                    maxLength={1000}
                    rows={3}
                    placeholder="Describe what modification you'd suggest…"
                    className="w-full p-3 border border-outline-variant rounded-xl resize-none outline-none focus:border-secondary font-body-md"
                  />
                )}

                <button
                  onClick={() => void submitResponse(a.id)}
                  disabled={!responses[a.id]?.response || submitting}
                  className="w-full py-3 bg-primary text-white rounded-xl font-label-md disabled:opacity-50"
                >
                  Submit my response
                </button>
              </div>
            )}
          </div>
        )
      })}

      {allSubmitted && (
        <div className="bg-primary-container/20 p-6 rounded-xl text-center">
          <span className="material-symbols-outlined text-primary text-4xl mb-2 block" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          <p className="font-headline-md text-on-surface mb-4">All responses submitted</p>
          <button
            onClick={() => router.push(`/case/${caseReference}/report`)}
            className="bg-primary text-white px-8 py-3 rounded-xl font-label-md"
          >
            Back to report
          </button>
        </div>
      )}
    </div>
  )
}
