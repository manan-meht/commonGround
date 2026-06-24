'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  caseReference: string
  caseId: string
  topic: string
  participantName: string
  otherPartyName: string
  role: 'initiator' | 'recipient'
}

interface SummaryData {
  whatHappened?: string
  emotionalImpact?: string
  theirNeeds?: string[]
  theirInterpretation?: string
  whatOtherPartyMayHaveExperienced?: string
  theirContribution?: string
  desiredOutcome?: string
  keyThemes?: string[]
}

const SUMMARY_FIELDS: { key: keyof SummaryData; label: string; icon: string }[] = [
  { key: 'whatHappened', label: 'What happened', icon: 'description' },
  { key: 'emotionalImpact', label: 'Emotional impact', icon: 'favorite' },
  { key: 'theirNeeds', label: 'Your needs', icon: 'volunteer_activism' },
  { key: 'theirInterpretation', label: 'Your interpretation', icon: 'psychology' },
  { key: 'whatOtherPartyMayHaveExperienced', label: "The other person's experience", icon: 'group' },
  { key: 'theirContribution', label: 'Your contribution', icon: 'self_improvement' },
  { key: 'desiredOutcome', label: 'Desired outcome', icon: 'flag' },
  { key: 'keyThemes', label: 'Key themes', icon: 'label' },
]

function SummaryCard({ summary }: { summary: string }) {
  let parsed: SummaryData | null = null
  try {
    parsed = JSON.parse(summary) as SummaryData
  } catch {
    // not valid JSON — show raw text
  }

  if (!parsed) {
    return (
      <div className="bg-white rounded-xl border border-outline-variant p-4">
        <p className="font-body-md text-on-surface whitespace-pre-wrap">{summary}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {SUMMARY_FIELDS.map(({ key, label, icon }) => {
        const value = parsed![key]
        if (!value || (Array.isArray(value) && value.length === 0)) return null
        return (
          <div key={key} className="bg-white rounded-xl border border-outline-variant p-4 flex gap-3">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            <div className="flex-1">
              <p className="text-label-sm font-medium text-primary uppercase tracking-wide mb-1">{label}</p>
              {Array.isArray(value) ? (
                <ul className="list-disc list-inside space-y-0.5">
                  {value.map((item, i) => (
                    <li key={i} className="font-body-md text-on-surface">{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="font-body-md text-on-surface">{value}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Hello. I'm here to help you prepare your private perspective. This is a confidential space — nothing you share here will be seen directly by the other participant. To get started, could you describe what happened from your perspective? Take your time.",
}

export function IntakeChat({ caseReference, topic, participantName }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showSummaryStep, setShowSummaryStep] = useState(false)
  const [summary, setSummary] = useState('')
  const [consented, setConsented] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load existing history on mount
  useEffect(() => {
    fetch('/api/intake/history')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json() as { messages: Array<{role: string; content: string}> }
          if (data.messages && data.messages.length > 0) {
            setMessages(
              data.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
            )
          }
        }
      })
      .catch(() => {})
  }, [])

  async function sendMessage() {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setInput('')
    setSending(true)
    setError('')

    const userMsg: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/intake/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })

      const data = await res.json() as { message?: string; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to send message.')
        return
      }

      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message! }])

        // Check if AI is signalling it's ready to summarise
        if (
          data.message.toLowerCase().includes('ready to generate') ||
          data.message.toLowerCase().includes('generate a summary') ||
          data.message.toLowerCase().includes('ready to review')
        ) {
          void requestSummary()
        }
      }
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function requestSummary() {
    setSending(true)
    try {
      const transcript = messages
        .map((m) => `${m.role === 'user' ? participantName : 'Facilitator'}: ${m.content}`)
        .join('\n\n')

      const res = await fetch('/api/intake/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })

      const data = await res.json() as { summary?: string; error?: string }
      if (res.ok && data.summary) {
        setSummary(data.summary)
        setShowSummaryStep(true)
      }
    } catch {
      setError('Failed to generate summary.')
    } finally {
      setSending(false)
    }
  }

  async function submitIntake() {
    if (!consented || !summary) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/intake/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary, consented: true }),
      })

      const data = await res.json() as { success?: boolean; readyForAnalysis?: boolean; error?: string; errors?: Record<string, string[]> }

      if (!res.ok) {
        const fieldErrors = data.errors ? Object.values(data.errors).flat().join(' ') : ''
        setError(fieldErrors || data.error || 'Failed to submit.')
        setSubmitting(false)
        return
      }

      if (data.readyForAnalysis) {
        // Trigger analysis in background
        fetch(`/api/cases/${caseReference}/analyse`, { method: 'POST' }).catch(() => {})
      }

      router.push(`/case/${caseReference}/waiting`)
    } catch {
      setError('A network error occurred.')
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const exchangeCount = messages.filter((m) => m.role === 'user').length
  const progressPct = Math.min((exchangeCount / 10) * 100, 95)

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface font-body-md text-on-surface antialiased">
      {/* Header */}
      <header className="bg-surface shadow-sm z-30 sticky top-0 px-margin-mobile py-4">
        <div className="max-w-container-max mx-auto flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md font-bold text-primary">Private Intake</span>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Private · {topic}
                </span>
              </div>
            </div>
            <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant" aria-label="Exit">
              <span className="material-symbols-outlined">close</span>
            </Link>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-label-sm text-on-surface-variant whitespace-nowrap">{exchangeCount} of ~10</span>
          </div>
        </div>
      </header>

      {/* Chat canvas */}
      <main className="flex-grow overflow-y-auto hide-scrollbar bg-surface px-margin-mobile py-stack-md" aria-live="polite" aria-label="Conversation">
        <div className="max-w-xl mx-auto flex flex-col gap-stack-md">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'flex-col items-end' : 'items-start gap-3'} w-full`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
              )}
              <div
                className={
                  msg.role === 'user'
                    ? 'bg-primary-container text-on-primary-container p-4 rounded-2xl bubble-user shadow-sm max-w-[85%]'
                    : 'bg-surface-container-highest text-on-surface p-4 rounded-2xl bubble-ai shadow-sm max-w-[85%]'
                }
              >
                <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex items-start gap-3 w-full max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div className="bg-surface-container-highest p-4 rounded-2xl bubble-ai shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input area */}
      {!showSummaryStep ? (
        <footer className="bg-surface border-t border-outline-variant p-4 pb-8 md:pb-4">
          <div className="max-w-xl mx-auto flex flex-col gap-3">
            {error && (
              <p className="text-error text-label-md" role="alert">{error}</p>
            )}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {exchangeCount >= 6 && (
                <button
                  onClick={requestSummary}
                  className="whitespace-nowrap px-4 py-2 bg-primary-container/20 text-on-primary-container font-label-md text-label-md rounded-full border border-primary/20 hover:bg-primary-container/30 transition-all"
                >
                  I&apos;m ready to review a summary
                </button>
              )}
            </div>
            <div className="flex items-end gap-2 bg-surface-container-low rounded-2xl p-2 border border-outline-variant focus-within:border-secondary transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={4000}
                placeholder="Type your reflection here…"
                className="flex-grow bg-transparent border-none focus:ring-0 resize-none font-body-md text-body-md py-2 px-3 min-h-[44px] max-h-32 text-on-surface"
                aria-label="Your message"
              />
              <button
                onClick={() => void sendMessage()}
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity shrink-0 mb-0.5 disabled:opacity-40"
                aria-label="Send message"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
              </button>
            </div>
          </div>
        </footer>
      ) : (
        /* Summary & consent step — full-screen overlay */
        <div className="fixed inset-0 z-50 bg-surface flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-outline-variant bg-surface shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
            <div>
              <h2 className="font-headline-sm text-on-surface leading-tight">Review your summary</h2>
              <p className="text-label-sm text-on-surface-variant">Check the details below, then submit</p>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-xl mx-auto flex flex-col gap-6">
              <SummaryCard summary={summary} />

{error && <p className="text-error text-label-md" role="alert">{error}</p>}

              <label className="flex items-start gap-3 cursor-pointer bg-secondary-container/20 p-4 rounded-xl">
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-outline-variant text-secondary focus:ring-secondary shrink-0"
                />
                <span className="font-body-md text-on-surface-variant">
                  I understand that my raw answers will not be shown directly to the other participant,
                  but the AI may reflect the meaning of what I shared in the joint report.
                </span>
              </label>

              <button
                onClick={() => void submitIntake()}
                disabled={!consented || submitting || !summary.trim()}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-body-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit my perspective'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
