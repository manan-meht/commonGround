'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AssistantVoicePlayer } from './AssistantVoicePlayer'
import { useVoiceRecorder } from './useVoiceRecorder'
import { formatDuration, MAX_RECORDING_SECONDS } from '@/lib/voice'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  voiceUrl?: string      // object URL or null
  voiceDuration?: number // seconds
}

function VoiceMessageBubble({ url, duration, content }: { url: string; duration?: number; content: string }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  function togglePlay() {
    if (!audioRef.current) return
    if (playing) { audioRef.current.pause() } else { void audioRef.current.play() }
    setPlaying(!playing)
  }

  return (
    <div className="flex flex-col gap-2">
      <p>{content}</p>
      <audio ref={audioRef} src={url} onEnded={() => setPlaying(false)} className="hidden" />
      <button
        onClick={togglePlay}
        aria-label={playing ? 'Pause voice message' : 'Listen to voice message'}
        className="self-start flex items-center gap-1.5 text-label-sm text-on-primary-container/70 hover:text-on-primary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {playing ? 'pause_circle' : 'play_circle'}
        </span>
        {playing ? 'Pause' : 'Listen'}{duration != null && ` · ${formatDuration(duration)}`}
      </button>
    </div>
  )
}

const VOICE_NOTICE_KEY = 'urushi_voice_notice_seen'

interface Props {
  caseReference: string
  caseId: string
  topic: string
  participantName: string
  otherPartyName: string
  role: 'initiator' | 'recipient'
  isLoggedIn?: boolean
  openingMessage?: string
}

// Matches IntakeSummarySchema from lib/ai/intakePrompt.ts
interface SpecificIncident {
  event: string
  participantActions: string[]
  otherPartyActions: string[]
  sequence: string
}

interface AcknowledgedContribution {
  behaviour: string
  acknowledgement: string
  willingnessToRepair: string
}

interface ThirdPartyImpact {
  personOrRole: string
  reportedImpact: string
  requestedRepair: string
}

interface SummaryData {
  conciseAccount?: string
  specificIncidents?: SpecificIncident[]
  recurringPatterns?: string[]
  intentions?: string[]
  reportedImpact?: string[]
  needs?: string[]
  acknowledgedContribution?: AcknowledgedContribution[]
  claimsAboutOtherPartyIntent?: string[]
  directRequests?: string[]
  desiredOutcome?: string[]
  nonNegotiables?: string[]
  thirdPartiesAffected?: ThirdPartyImpact[]
  uncertainOrInterpretivePoints?: string[]
  safetySignals?: string[]
}

function StringList({ items, icon }: { items: string[]; icon: string }) {
  if (!items.length) return null
  return (
    <ul className="space-y-1 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 font-body-md text-on-surface">
          <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function SummarySection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-outline-variant p-4">
      <p className="text-label-sm font-medium text-primary uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  )
}

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
      {parsed.conciseAccount && (
        <SummarySection label="What happened">
          <p className="font-body-md text-on-surface">{parsed.conciseAccount}</p>
        </SummarySection>
      )}

      {parsed.specificIncidents && parsed.specificIncidents.length > 0 && (
        <SummarySection label="Specific incidents">
          <div className="space-y-3">
            {parsed.specificIncidents.map((inc, i) => (
              <div key={i} className={i > 0 ? 'pt-3 border-t border-outline-variant/40' : ''}>
                <p className="font-body-md font-medium text-on-surface mb-1">{inc.event}</p>
                {inc.sequence && <p className="text-label-sm text-on-surface-variant mb-1">{inc.sequence}</p>}
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {parsed.reportedImpact && parsed.reportedImpact.length > 0 && (
        <SummarySection label="Impact on you">
          <StringList items={parsed.reportedImpact} icon="favorite" />
        </SummarySection>
      )}

      {parsed.needs && parsed.needs.length > 0 && (
        <SummarySection label="Your needs">
          <StringList items={parsed.needs} icon="volunteer_activism" />
        </SummarySection>
      )}

      {parsed.desiredOutcome && parsed.desiredOutcome.length > 0 && (
        <SummarySection label="What you want">
          <StringList items={parsed.desiredOutcome} icon="flag" />
        </SummarySection>
      )}

      {parsed.directRequests && parsed.directRequests.length > 0 && (
        <SummarySection label="Your requests">
          <StringList items={parsed.directRequests} icon="arrow_forward" />
        </SummarySection>
      )}

      {parsed.acknowledgedContribution && parsed.acknowledgedContribution.length > 0 && (
        <SummarySection label="Your acknowledged contribution">
          {parsed.acknowledgedContribution.map((ac, i) => (
            <div key={i} className="font-body-md text-on-surface mb-1">
              <span className="font-medium">{ac.behaviour}</span>
              {ac.acknowledgement && <span className="text-on-surface-variant"> — {ac.acknowledgement}</span>}
            </div>
          ))}
        </SummarySection>
      )}

      {parsed.recurringPatterns && parsed.recurringPatterns.length > 0 && (
        <SummarySection label="Recurring patterns">
          <StringList items={parsed.recurringPatterns} icon="refresh" />
        </SummarySection>
      )}

      {parsed.nonNegotiables && parsed.nonNegotiables.length > 0 && (
        <SummarySection label="Non-negotiables">
          <StringList items={parsed.nonNegotiables} icon="block" />
        </SummarySection>
      )}

      {parsed.uncertainOrInterpretivePoints && parsed.uncertainOrInterpretivePoints.length > 0 && (
        <SummarySection label="Uncertain or interpretive points">
          <StringList items={parsed.uncertainOrInterpretivePoints} icon="help" />
        </SummarySection>
      )}

      {parsed.safetySignals && parsed.safetySignals.length > 0 && (
        <SummarySection label="Safety signals noted">
          <StringList items={parsed.safetySignals} icon="warning" />
        </SummarySection>
      )}
    </div>
  )
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: "Briefly tell me what happened in the most recent incident, what each person did, and what you most want to change. Three to six sentences is enough to get started.",
}

export function IntakeChat({ caseReference, topic, participantName, role, isLoggedIn, openingMessage }: Props) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: openingMessage ?? INITIAL_MESSAGE.content },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showSummaryStep, setShowSummaryStep] = useState(false)
  const [summary, setSummary] = useState('')
  const [consented, setConsented] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showVoiceNotice, setShowVoiceNotice] = useState(false)
  const recorder = useVoiceRecorder()
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
          const data = await res.json() as { messages: Array<{id?: string; role: string; content: string}> }
          if (data.messages && data.messages.length > 0) {
            setMessages(
              data.messages.map((m) => ({
                role: (m.role === 'participant' ? 'user' : 'assistant') as 'user' | 'assistant',
                content: m.content,
                id: m.id,
              }))
            )
          }
        }
      })
      .catch(() => {})
  }, [])

  async function sendMessage(text?: string) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || sending) return

    if (text === undefined) setInput('')
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

      const data = await res.json() as { message?: string; messageId?: string | null; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Failed to send message.')
        return
      }

      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message!, id: data.messageId ?? undefined }])
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

      if (role === 'initiator') {
        router.push(`/case/${caseReference}/brief`)
      } else {
        router.push(`/case/${caseReference}/waiting`)
      }
    } catch {
      setError('A network error occurred.')
      setSubmitting(false)
    }
  }

  function beginRecording() {
    if (!recorder.supported) {
      recorder.setError('Voice notes are not supported in this browser. You can still type.')
      return
    }
    if (typeof window !== 'undefined' && !window.localStorage.getItem(VOICE_NOTICE_KEY)) {
      setShowVoiceNotice(true)
      return
    }
    void recorder.start()
  }

  function confirmVoiceNotice() {
    if (typeof window !== 'undefined') window.localStorage.setItem(VOICE_NOTICE_KEY, '1')
    setShowVoiceNotice(false)
    void recorder.start()
  }

  async function sendMessageFromTranscript(transcript: string, audioUrl: string | null, duration: number) {
    if (sending) return
    setSending(true)
    setError('')

    // Add user voice message to UI immediately
    const voiceMsg: Message = {
      role: 'user',
      content: transcript,
      voiceUrl: audioUrl ?? undefined,
      voiceDuration: duration,
    }
    setMessages(prev => [...prev, voiceMsg])
    recorder.cancel() // reset recorder state

    try {
      const res = await fetch('/api/intake/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: transcript }),
      })
      const data = await res.json() as { message?: string; messageId?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to send message.')
        return
      }
      if (data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message!, id: data.messageId }])
      }
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setSending(false)
    }
  }

  async function handleSendVoice() {
    const duration = recorder.duration
    try {
      const { transcript, persistentAudioUrl } = await recorder.sendVoiceMessage()
      if (!transcript.trim()) {
        if (persistentAudioUrl) URL.revokeObjectURL(persistentAudioUrl)
        recorder.setError('We couldn\'t understand this voice message. Try again or type your message instead.')
        return
      }
      await sendMessageFromTranscript(transcript, persistentAudioUrl, duration)
    } catch {
      // error and URL cleanup already handled in the hook
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  const exchangeCount = messages.filter((m) => m.role === 'user').length
  const progressPct = Math.min((exchangeCount / 5) * 100, 95)

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
            <div className="flex items-center gap-1">
              {isLoggedIn && (
                <Link href="/dashboard" className="text-on-surface-variant font-label-md flex items-center gap-1 hover:text-secondary transition-colors px-2 py-2 rounded-full hover:bg-surface-container">
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  <span className="hidden md:inline text-label-sm">My cases</span>
                </Link>
              )}
              <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant" aria-label="Exit">
                <span className="material-symbols-outlined">close</span>
              </Link>
            </div>
          </div>
          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-label-sm text-on-surface-variant whitespace-nowrap">{exchangeCount} exchange{exchangeCount !== 1 ? 's' : ''}</span>
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
                {msg.voiceUrl ? (
                  <VoiceMessageBubble url={msg.voiceUrl} duration={msg.voiceDuration} content={msg.content} />
                ) : (
                  <p className="font-body-md text-body-md whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.role === 'assistant' && msg.id && (
                  <AssistantVoicePlayer messageId={msg.id} />
                )}
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
            {exchangeCount >= 1 && (
              <button
                onClick={() => void requestSummary()}
                disabled={sending}
                className="w-full py-3 bg-primary-container text-on-primary-container font-label-md text-label-md rounded-xl border border-primary/20 hover:bg-primary-container/80 transition-all disabled:opacity-50"
              >
                I&apos;m ready — generate my summary
              </button>
            )}
            {/* Microphone error states — shown as dismissible cards */}
            {recorder.error === 'permission-denied' && (
              <div className="bg-error-container/20 border border-error-container rounded-xl p-4 flex gap-3" role="alert" aria-live="assertive">
                <span className="material-symbols-outlined text-error shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>mic_off</span>
                <div className="flex flex-col gap-1">
                  <p className="font-label-md font-medium text-on-surface">Microphone access is blocked</p>
                  <p className="font-body-md text-on-surface-variant text-sm">
                    Allow microphone access in your browser&apos;s site settings, then try again.
                  </p>
                  <p className="font-label-sm text-on-surface-variant text-xs mt-1">
                    Chrome: click the lock icon in the address bar → Microphone → Allow.<br />
                    Safari: Settings → Websites → Microphone → Allow for this site.
                  </p>
                  <button onClick={recorder.cancel} className="self-start mt-2 text-label-sm text-primary hover:underline">Dismiss</button>
                </div>
              </div>
            )}
            {recorder.error === 'no-device' && (
              <div className="bg-surface-container rounded-xl p-4 flex gap-3" role="alert" aria-live="polite">
                <span className="material-symbols-outlined text-on-surface-variant shrink-0 mt-0.5">mic_none</span>
                <div>
                  <p className="font-label-md font-medium text-on-surface">No microphone found on this device</p>
                  <p className="font-body-md text-on-surface-variant text-sm">Connect a microphone and try again, or type your response below.</p>
                  <button onClick={recorder.cancel} className="self-start mt-2 text-label-sm text-primary hover:underline">Dismiss</button>
                </div>
              </div>
            )}
            {recorder.error === 'in-use' && (
              <div className="bg-surface-container rounded-xl p-4 flex gap-3" role="alert" aria-live="polite">
                <span className="material-symbols-outlined text-on-surface-variant shrink-0 mt-0.5">mic_off</span>
                <div>
                  <p className="font-label-md font-medium text-on-surface">Microphone is in use by another app</p>
                  <p className="font-body-md text-on-surface-variant text-sm">Close other apps using the microphone and try again.</p>
                  <button onClick={recorder.cancel} className="self-start mt-2 text-label-sm text-primary hover:underline">Dismiss</button>
                </div>
              </div>
            )}
            {(recorder.error === 'unavailable' || recorder.error === 'insecure-context') && (
              <p className="text-error text-label-md" role="alert" aria-live="polite">
                {recorder.error === 'insecure-context'
                  ? 'Voice input requires a secure connection (HTTPS).'
                  : 'We couldn\'t access your microphone. Please try again.'}
              </p>
            )}
            {recorder.error === 'unsupported' && (
              <p className="text-on-surface-variant text-label-md" role="alert" aria-live="polite">Voice recording is not supported in this browser.</p>
            )}
            {recorder.error &&
              !(['permission-denied', 'no-device', 'in-use', 'unavailable', 'insecure-context', 'unsupported'] as Array<typeof recorder.error>).includes(recorder.error) && (
                <p className="text-error text-label-md" role="alert" aria-live="polite">{recorder.error}</p>
            )}

            {/* One-time consent notice before first recording */}
            {showVoiceNotice && (
              <div className="bg-secondary-container/30 rounded-xl p-4 flex flex-col gap-3">
                <p className="font-body-md text-on-surface">
                  Your voice note will be processed to create a transcript. You can review and edit it before anything is sent.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmVoiceNotice}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md"
                  >
                    Got it — start recording
                  </button>
                  <button
                    onClick={() => setShowVoiceNotice(false)}
                    className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Recording / preview / review states */}
            {(recorder.state === 'requesting' || recorder.state === 'recording') && (
              <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant flex flex-col gap-3" aria-live="assertive">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-error animate-pulse shrink-0" />
                  <span className="font-body-md text-on-surface flex-1">
                    {recorder.state === 'requesting' ? 'Waiting for microphone permission…' : `Recording… ${formatDuration(recorder.elapsed)} / ${formatDuration(MAX_RECORDING_SECONDS)}`}
                  </span>
                </div>
                {recorder.showFocusHint && (
                  <p className="text-label-sm text-on-surface-variant">Try to focus on one incident or concern at a time.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={recorder.stop}
                    disabled={recorder.state !== 'recording'}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md disabled:opacity-50"
                  >
                    Stop
                  </button>
                  <button
                    onClick={recorder.cancel}
                    className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {recorder.state === 'preview' && recorder.audioUrl && (
              <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Voice message</span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{formatDuration(recorder.duration)}</span>
                </div>
                <audio controls src={recorder.audioUrl} className="w-full" aria-label="Recorded voice note" />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => void handleSendVoice()}
                    disabled={sending}
                    className="px-4 py-2 bg-primary text-on-primary rounded-xl font-label-md text-label-md disabled:opacity-50"
                  >
                    Send voice message
                  </button>
                  <button
                    onClick={recorder.reRecord}
                    className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md"
                  >
                    Re-record
                  </button>
                  <button
                    onClick={recorder.cancel}
                    className="px-4 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {(recorder.state === 'uploading' || recorder.state === 'sending-to-chat' || recorder.state === 'transcribing') && (
              <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant flex items-center gap-3" aria-live="polite">
                <span className="material-symbols-outlined text-primary animate-spin">progress_activity</span>
                <span className="font-body-md text-on-surface">Sending…</span>
              </div>
            )}

            {/* Text composer — hidden while actively in a voice flow */}
            {(['idle', 'requesting', 'error'] as Array<typeof recorder.state>).includes(recorder.state) && (
              <>
              {recorder.supported && recorder.state !== 'requesting' && (
                <p className="text-label-sm text-on-surface-variant text-center flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-secondary">mic</span>
                  Tap the mic to speak your response
                </p>
              )}
              {recorder.state === 'requesting' && (
                <p className="text-label-sm text-on-surface-variant text-center" aria-live="polite">
                  Waiting for microphone permission…
                </p>
              )}
              <div className="flex items-end gap-2 bg-surface-container-low rounded-2xl p-2 border border-outline-variant focus-within:border-secondary transition-colors">
                <div className="relative flex items-end shrink-0 mb-0.5">
                  <button
                    onClick={beginRecording}
                    disabled={sending || recorder.state === 'requesting'}
                    className="w-10 h-10 rounded-xl text-secondary hover:bg-secondary-container flex items-center justify-center disabled:opacity-40 transition-colors"
                    aria-label={recorder.state === 'requesting' ? 'Waiting for microphone permission' : 'Record a voice message'}
                    title="Speak your response"
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {recorder.state === 'requesting' ? 'hourglass_empty' : 'mic'}
                    </span>
                  </button>
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary" aria-hidden="true" />
                </div>
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
              </>
            )}
          </div>
        </footer>
      ) : (
        /* Summary & consent step — full-screen overlay */
        <div className="fixed inset-0 z-50 bg-surface flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-outline-variant bg-surface shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
            <div className="flex-1">
              <h2 className="font-headline-sm text-on-surface leading-tight">Review your summary</h2>
              <p className="text-label-sm text-on-surface-variant">Does this accurately capture your perspective?</p>
            </div>
            <button
              onClick={() => { setShowSummaryStep(false); setSummary('') }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors font-label-sm text-label-sm"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Add more
            </button>
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
