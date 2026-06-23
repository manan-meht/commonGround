'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function StartConversationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [serverError, setServerError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setServerError('')

    const fd = new FormData(e.currentTarget)
    const body = {
      initiatorName: fd.get('initiatorName'),
      initiatorContact: fd.get('initiatorContact'),
      recipientName: fd.get('recipientName'),
      recipientPhone: fd.get('recipientPhone'),
      topic: fd.get('topic'),
    }

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json() as { caseReference?: string; errors?: Record<string, string[]>; error?: string }

      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        else setServerError(data.error ?? 'An error occurred. Please try again.')
        return
      }

      if (data.caseReference) {
        router.push(`/case/${data.caseReference}/intake`)
      }
    } catch {
      setServerError('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-margin-mobile pb-stack-lg max-w-xl mx-auto">
      <form className="space-y-gutter" onSubmit={handleSubmit} noValidate>

        {serverError && (
          <div className="bg-error-container text-on-error-container p-4 rounded-xl font-body-md" role="alert">
            {serverError}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="text-label-sm font-label-sm text-primary tracking-widest uppercase">Your Details</h2>

          <div className="space-y-stack-sm">
            <label htmlFor="initiatorName" className="block font-label-md text-on-surface-variant ml-1">
              Your First Name
            </label>
            <input
              id="initiatorName"
              name="initiatorName"
              type="text"
              required
              maxLength={80}
              placeholder="e.g., Alex"
              className="w-full h-14 px-4 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline/50"
              aria-describedby={errors['initiatorName'] ? 'initiatorName-error' : undefined}
            />
            {errors['initiatorName'] && (
              <p id="initiatorName-error" className="text-error text-label-md ml-1" role="alert">{errors['initiatorName'][0]}</p>
            )}
          </div>

          <div className="space-y-stack-sm">
            <label htmlFor="initiatorContact" className="block font-label-md text-on-surface-variant ml-1">
              Your Email or Phone
            </label>
            <input
              id="initiatorContact"
              name="initiatorContact"
              type="text"
              required
              maxLength={200}
              placeholder="For case access"
              className="w-full h-14 px-4 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline/50"
              aria-describedby={errors['initiatorContact'] ? 'initiatorContact-error' : undefined}
            />
            {errors['initiatorContact'] && (
              <p id="initiatorContact-error" className="text-error text-label-md ml-1" role="alert">{errors['initiatorContact'][0]}</p>
            )}
          </div>
        </section>

        <section className="space-y-4 pt-4">
          <h2 className="text-label-sm font-label-sm text-primary tracking-widest uppercase">Invite the Other Person</h2>

          <div className="space-y-stack-sm">
            <label htmlFor="recipientName" className="block font-label-md text-on-surface-variant ml-1">
              Their First Name
            </label>
            <input
              id="recipientName"
              name="recipientName"
              type="text"
              required
              maxLength={80}
              placeholder="Who will you be speaking with?"
              className="w-full h-14 px-4 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline/50"
              aria-describedby={errors['recipientName'] ? 'recipientName-error' : undefined}
            />
            {errors['recipientName'] && (
              <p id="recipientName-error" className="text-error text-label-md ml-1" role="alert">{errors['recipientName'][0]}</p>
            )}
          </div>

          <div className="space-y-stack-sm">
            <label htmlFor="recipientPhone" className="block font-label-md text-on-surface-variant ml-1">
              Their WhatsApp Number
            </label>
            <div className="relative">
              <input
                id="recipientPhone"
                name="recipientPhone"
                type="tel"
                required
                placeholder="+1 555 555 5555"
                className="w-full h-14 px-4 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline/50"
                aria-describedby={errors['recipientPhone'] ? 'recipientPhone-error' : 'recipientPhone-hint'}
              />
            </div>
            <p id="recipientPhone-hint" className="text-[12px] text-outline-variant mt-1 ml-1 italic">
              Include the country code, e.g. +44 7911 123456
            </p>
            {errors['recipientPhone'] && (
              <p id="recipientPhone-error" className="text-error text-label-md ml-1" role="alert">{errors['recipientPhone'][0]}</p>
            )}
          </div>
        </section>

        <section className="space-y-4 pt-4">
          <h2 className="text-label-sm font-label-sm text-primary tracking-widest uppercase">The Conversation</h2>

          <div className="space-y-stack-sm">
            <label htmlFor="topic" className="block font-label-md text-on-surface-variant ml-1">
              Neutral Discussion Topic
            </label>
            <textarea
              id="topic"
              name="topic"
              required
              rows={3}
              maxLength={500}
              placeholder="e.g., 'Shared schedule for the upcoming holidays' or 'Revisiting our communication approach'"
              className="w-full p-4 bg-white border border-outline-variant rounded-xl focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline/50 resize-none"
              aria-describedby="topic-hint topic-warning"
            />
            <p id="topic-hint" className="text-[12px] text-on-surface-variant leading-relaxed">
              <span className="font-bold text-primary">Tip:</span>{' '}
              Frame the topic neutrally — the other person will see this description.
            </p>
            <div id="topic-warning" className="bg-secondary-container/20 text-on-secondary-container p-3 rounded-lg text-label-md">
              ⚠️ Do not include accusations, private details, or sensitive personal information in the topic. The other person will see it.
            </div>
            {errors['topic'] && (
              <p className="text-error text-label-md ml-1" role="alert">{errors['topic'][0]}</p>
            )}
          </div>
        </section>

        <div className="bg-surface-container-low p-4 rounded-xl space-y-3">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            <div className="space-y-1">
              <h3 className="text-label-md font-bold text-on-surface">Privacy Notice</h3>
              <p className="text-label-sm text-on-surface-variant leading-tight">
                Your conversation with the AI facilitator is encrypted. Your raw responses are never
                shown directly to the other participant. A neutral shared report is only generated after
                both parties have independently submitted their perspectives.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-primary text-white rounded-xl font-bold text-body-md hover:bg-on-primary-fixed-variant transition-all active:scale-[0.98] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Setting up your private space…
              </span>
            ) : 'Continue privately'}
          </button>
        </div>
      </form>
    </div>
  )
}
