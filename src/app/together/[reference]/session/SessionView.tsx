'use client'

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import type {
  DbTogetherSession, DbTogetherMessage, DbTogetherTurnSummary, DbTogetherIssue,
  TogetherSpeaker, MessageReview,
} from '@/lib/db/types'
import { MAX_RECORDING_SECONDS, selectRecordingMimeType } from '@/lib/voice'

interface Props {
  session: DbTogetherSession
  caseReference: string
  messages: DbTogetherMessage[]
  summaries: DbTogetherTurnSummary[]
  issues: DbTogetherIssue[]
  viewerSpeaker?: 'person_a' | 'person_b'
}

const PROGRESS_STEPS = [
  { label: 'Talk it through', stages: ['person_a_sharing', 'person_b_sharing'] },
  { label: 'Review summaries', stages: ['person_a_summary_review', 'person_b_summary_review', 'sharing_confirmation'] },
  { label: 'Shared understanding', stages: ['shared_understanding'] },
  { label: 'Final agreement', stages: ['issue_discussion', 'final_agreement', 'completed'] },
]

function getProgressStep(stage: string): number {
  return PROGRESS_STEPS.findIndex(s => s.stages.includes(stage))
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SessionView({
  session: initialSession,
  caseReference,
  messages: initialMessages,
  summaries: initialSummaries,
  viewerSpeaker = 'person_a',
}: Props) {
  const router = useRouter()
  const [session, setSession] = useState(initialSession)
  const [messages, setMessages] = useState(initialMessages)
  const [summaries, setSummaries] = useState(initialSummaries)

  const [textInput, setTextInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [endingPhase, setEndingPhase] = useState(false)
  const [error, setError] = useState('')

  // Reframe modal
  const [pendingReview, setPendingReview] = useState<MessageReview | null>(null)
  const [pendingContent, setPendingContent] = useState('')

  // Voice recording
  const [recording, setRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Summary approval
  const [currentSummary, setCurrentSummary] = useState<DbTogetherTurnSummary | null>(null)
  const [editedSummary, setEditedSummary] = useState('')
  const [approvingState, setApprovingState] = useState<'idle' | 'loading' | 'error'>('idle')

  // Readiness
  const [readinessLoading, setReadinessLoading] = useState(false)

  // Separate-device mode: poll for state changes when it's not your turn
  const deviceMode = (session as DbTogetherSession & { device_mode?: string }).device_mode ?? 'shared'
  const isMyTurn = deviceMode === 'shared' || session.current_speaker === viewerSpeaker
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (deviceMode !== 'separate') return
    if (isMyTurn) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      return
    }
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/together/sessions/${session.id}`)
        if (!res.ok) return
        const data = await res.json() as {
          session: DbTogetherSession
          messages: DbTogetherMessage[]
          summaries: DbTogetherTurnSummary[]
        }
        setSession(data.session)
        setMessages(data.messages)
        setSummaries(data.summaries)
      } catch { /* silent */ }
    }, 3000)
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current) }
  }, [deviceMode, isMyTurn, session.id])

  // Scroll to bottom of chat on new messages
  const chatEndRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sid = session.id
  const stage = session.stage
  const speaker = session.current_speaker as TogetherSpeaker | null
  const personAName = session.person_a_name
  const personBName = session.person_b_name
  const progressStep = getProgressStep(stage)

  // Surface latest summary when entering review stage
  useEffect(() => {
    if (stage === 'person_a_summary_review' || stage === 'person_b_summary_review') {
      const sp: TogetherSpeaker = stage === 'person_a_summary_review' ? 'person_a' : 'person_b'
      const latest = summaries
        .filter(s => s.speaker === sp)
        .sort((a, b) => b.round_number - a.round_number)[0] ?? null
      setCurrentSummary(latest)
      setEditedSummary(latest?.approved_summary ?? latest?.ai_summary ?? '')
    }
  }, [stage, summaries])

  // ── Submit message ──────────────────────────────────────────────────────────
  const submitMessage = useCallback(async (content: string, useReframe = false) => {
    if (!content.trim() || !speaker) return
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch(`/api/together/sessions/${sid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, speaker, useReframe }),
      })
      const data = await res.json() as {
        message?: DbTogetherMessage
        nextSpeaker?: TogetherSpeaker
        nextStage?: string
        needsChoice?: boolean
        blocked?: boolean
        review?: MessageReview
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? 'Failed to send message.')
        return
      }

      if (data.blocked && data.review) {
        setError(`Urushi can't share this message as written. ${data.review.reason ?? ''}`)
        return
      }

      if (data.needsChoice && data.review) {
        setPendingContent(content)
        setPendingReview(data.review)
        return
      }

      if (data.message) {
        setMessages(prev => [...prev, data.message!])
        setTextInput('')
        setVoiceTranscript('')
      }

      // Update speaker and stage from API response
      if (data.nextSpeaker && data.nextStage) {
        setSession(s => ({ ...s, current_speaker: data.nextSpeaker!, stage: data.nextStage! as DbTogetherSession['stage'] }))
      }
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [sid, speaker])

  // ── End sharing phase → generate summaries ──────────────────────────────────
  const endSharingPhase = useCallback(async () => {
    setEndingPhase(true)
    setError('')
    try {
      const res = await fetch(`/api/together/sessions/${sid}/turns/end`, { method: 'POST' })
      const data = await res.json() as { summaryId?: string; summary?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to generate summary.')
        return
      }
      const sessionRes = await fetch(`/api/together/sessions/${sid}`)
      if (sessionRes.ok) {
        const sd = await sessionRes.json() as { session: DbTogetherSession; summaries: DbTogetherTurnSummary[] }
        setSession(sd.session)
        setSummaries(sd.summaries)
      }
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setEndingPhase(false)
    }
  }, [sid])

  // ── Summary approval ────────────────────────────────────────────────────────
  const approveSummary = useCallback(async () => {
    if (!currentSummary) return
    setApprovingState('loading')
    try {
      const res = await fetch(`/api/together/sessions/${sid}/summaries/${currentSummary.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedSummary: editedSummary }),
      })
      const data = await res.json() as { nextStage?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to approve summary.')
        setApprovingState('error')
        return
      }
      const sessionRes = await fetch(`/api/together/sessions/${sid}`)
      if (sessionRes.ok) {
        const sd = await sessionRes.json() as { session: DbTogetherSession; summaries: DbTogetherTurnSummary[]; messages: DbTogetherMessage[] }
        setSession(sd.session)
        setSummaries(sd.summaries)
        setMessages(sd.messages)
      }
      setApprovingState('idle')
    } catch {
      setError('A network error occurred.')
      setApprovingState('error')
    }
  }, [sid, currentSummary, editedSummary])

  // ── Readiness ───────────────────────────────────────────────────────────────
  const confirmReadiness = useCallback(async (sp: TogetherSpeaker) => {
    setReadinessLoading(true)
    try {
      const res = await fetch(`/api/together/sessions/${sid}/readiness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ speaker: sp }),
      })
      const data = await res.json() as { bothReady?: boolean; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to confirm readiness.'); return }
      if (data.bothReady) {
        router.push(`/together/${caseReference}/understanding`)
      } else {
        const sessionRes = await fetch(`/api/together/sessions/${sid}`)
        if (sessionRes.ok) {
          const sd = await sessionRes.json() as { session: DbTogetherSession }
          setSession(sd.session)
        }
      }
    } catch {
      setError('A network error occurred.')
    } finally {
      setReadinessLoading(false)
    }
  }, [sid, caseReference, router])

  // ── Voice recording ─────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = selectRecordingMimeType()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(250)
      mediaRecorderRef.current = mr
      setRecording(true)
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => {
          if (s + 1 >= MAX_RECORDING_SECONDS) stopRecording()
          return s + 1
        })
      }, 1000)
    } catch {
      setError('Could not access microphone. Please check permissions.')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    setRecording(false)

    mediaRecorderRef.current.onstop = async () => {
      const mimeType = mediaRecorderRef.current?.mimeType ?? 'audio/webm'
      const blob = new Blob(chunksRef.current, { type: mimeType })
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      const file = new File([blob], `recording.${ext}`, { type: mimeType })
      setTranscribing(true)
      try {
        const fd = new FormData()
        fd.append('audio', file)
        const res = await fetch(`/api/together/sessions/${sid}/transcribe`, { method: 'POST', body: fd })
        const data = await res.json() as { transcript?: string; error?: string }
        if (!res.ok) { setError(data.error ?? 'Transcription failed.'); return }
        setVoiceTranscript(data.transcript ?? '')
      } catch {
        setError('Transcription failed. Please try again.')
      } finally {
        setTranscribing(false)
      }
    }
  }, [sid])

  // ─── Summary review screen ────────────────────────────────────────────────────
  if (stage === 'person_a_summary_review' || stage === 'person_b_summary_review') {
    const reviewSpeakerName = stage === 'person_a_summary_review' ? personAName : personBName
    return (
      <SummaryReviewView
        speakerName={reviewSpeakerName}
        summary={currentSummary}
        editedSummary={editedSummary}
        setEditedSummary={setEditedSummary}
        onApprove={() => void approveSummary()}
        approvingState={approvingState}
        error={error}
      />
    )
  }

  // ─── Sharing confirmation ─────────────────────────────────────────────────────
  if (stage === 'sharing_confirmation') {
    return (
      <SharingConfirmationView
        personAName={personAName}
        personBName={personBName}
        aConfirmed={!!session.person_a_ready_confirmed_at}
        bConfirmed={!!session.person_b_ready_confirmed_at}
        onConfirm={confirmReadiness}
        loading={readinessLoading}
        error={error}
      />
    )
  }

  // ─── Main chat view ───────────────────────────────────────────────────────────
  const activeSpeakerName = speaker === 'person_a' ? personAName : personBName
  const waitingSpeakerName = speaker === 'person_a' ? personBName : personAName
  const hasMessages = messages.length > 0

  return (
    <main className="flex-grow w-full max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>

      {/* Progress + topic header */}
      <div className="px-4 pt-3 pb-2 border-b border-outline-variant/30 shrink-0 space-y-2">
        <ProgressBar currentStep={progressStep} />
        <p className="font-label-sm text-on-surface-variant text-[12px] truncate">{session.topic}</p>
      </div>

      {/* Chat thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {!hasMessages && (
          <div className="text-center py-8 space-y-2">
            <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-white text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
            </div>
            <p className="font-body-md text-on-surface-variant">
              <strong>{personAName}</strong> goes first. Share what&apos;s on your mind.
            </p>
          </div>
        )}

        {messages.map((m) => {
          const isA = m.speaker === 'person_a'
          const name = isA ? personAName : personBName
          return (
            <div key={m.id} className={`flex flex-col gap-1 ${isA ? 'items-start' : 'items-end'}`}>
              <span className="font-label-sm text-outline text-[11px] px-1">{name}</span>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                isA
                  ? 'bg-surface-container-lowest border border-outline-variant/40 rounded-tl-sm'
                  : 'bg-secondary-container/30 border border-secondary/20 rounded-tr-sm'
              }`}>
                <p className="font-body-md text-on-surface leading-relaxed text-[15px]">
                  {m.display_content ?? m.content}
                </p>
                {m.voice_transcript && (
                  <p className="font-label-sm text-outline mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">mic</span>
                    Voice note
                  </p>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing indicator — shows when other person has text in the input */}
        {submitting && (
          <div className={`flex flex-col gap-1 ${speaker === 'person_a' ? 'items-start' : 'items-end'}`}>
            <span className="font-label-sm text-outline text-[11px] px-1">{activeSpeakerName}</span>
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-outline rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-outline rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-outline rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Active speaker turn indicator + input */}
      <div className="shrink-0 border-t border-outline-variant/30 bg-surface">

        {/* Turn label */}
        <div className={`px-4 pt-3 pb-2 flex items-center gap-2 ${
          speaker === 'person_a' ? 'bg-primary-container/10' : 'bg-secondary-container/15'
        }`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-label-sm shrink-0 ${
            speaker === 'person_a' ? 'bg-primary' : 'bg-secondary'
          }`}>
            {activeSpeakerName?.[0]?.toUpperCase()}
          </div>
          <p className="font-label-md text-on-surface font-semibold">
            {activeSpeakerName}&apos;s turn
          </p>
          {deviceMode === 'separate' && !isMyTurn && (
            <span className="ml-auto flex items-center gap-1.5 font-label-sm text-on-surface-variant text-[12px]">
              <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" />
              </span>
              Waiting for {activeSpeakerName}
            </span>
          )}
          {(deviceMode === 'shared' || isMyTurn) && hasMessages && (
            <p className="ml-auto font-label-sm text-on-surface-variant text-[12px]">
              {waitingSpeakerName} is waiting
            </p>
          )}
        </div>

        {/* Separate-device: not your turn — show waiting panel instead of input */}
        {deviceMode === 'separate' && !isMyTurn && (
          <div className="px-4 py-4 text-center">
            <p className="font-body-md text-on-surface-variant text-sm">
              It&apos;s {activeSpeakerName}&apos;s turn. You&apos;ll be notified when they&apos;ve sent their message.
            </p>
          </div>
        )}

        {/* Voice transcript preview */}
        {(deviceMode === 'shared' || isMyTurn) && voiceTranscript && (
          <div className="mx-4 mt-2 bg-surface-container-low rounded-xl p-3 border border-secondary/20 space-y-2">
            <p className="font-label-sm text-secondary text-[11px] uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">mic</span>
              Review transcript before sending
            </p>
            <textarea
              value={voiceTranscript}
              onChange={e => setVoiceTranscript(e.target.value)}
              className="w-full rounded-lg border border-outline-variant p-2 font-body-md text-on-surface text-sm resize-none focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => void submitMessage(voiceTranscript)}
                disabled={submitting}
                className="flex-1 py-2 bg-secondary text-white rounded-xl font-bold font-label-md text-sm disabled:opacity-60"
              >
                {submitting ? 'Sending…' : 'Send voice note'}
              </button>
              <button
                onClick={() => setVoiceTranscript('')}
                className="px-3 py-2 border border-outline-variant rounded-xl font-label-md text-on-surface-variant text-sm"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Text input */}
        {(deviceMode === 'shared' || isMyTurn) && !voiceTranscript && (
          <div className="px-4 pt-2 pb-3 flex gap-2 items-end">
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && textInput.trim()) {
                  e.preventDefault()
                  void submitMessage(textInput)
                }
              }}
              placeholder={`${activeSpeakerName}, type here… (Enter to send)`}
              rows={2}
              className="flex-1 rounded-xl border border-outline-variant p-3 font-body-md text-on-surface placeholder:text-outline/50 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none resize-none transition-all text-[15px]"
              disabled={submitting || transcribing}
            />
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => void submitMessage(textInput)}
                disabled={!textInput.trim() || submitting || transcribing}
                className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
                aria-label="Send message"
              >
                {submitting
                  ? <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <span className="material-symbols-outlined text-[20px]">send</span>
                }
              </button>
              {!recording && !transcribing && (
                <button
                  onClick={() => void startRecording()}
                  className="w-11 h-11 border-2 border-secondary text-secondary rounded-xl flex items-center justify-center hover:bg-secondary/5 transition-all active:scale-95"
                  aria-label="Record voice note"
                >
                  <span className="material-symbols-outlined text-[20px]">mic</span>
                </button>
              )}
              {recording && (
                <button
                  onClick={stopRecording}
                  className="w-11 h-11 bg-error text-white rounded-xl flex items-center justify-center animate-pulse"
                  aria-label={`Stop recording (${recordingSeconds}s)`}
                >
                  <span className="material-symbols-outlined text-[18px]">stop</span>
                </button>
              )}
              {transcribing && (
                <div className="w-11 h-11 border border-outline-variant rounded-xl flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mx-4 mb-3 bg-error-container text-on-error-container p-3 rounded-xl text-sm flex items-center gap-2" role="alert">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="shrink-0 underline text-xs">Dismiss</button>
          </div>
        )}

        {/* End sharing phase — shown after at least one round of exchange */}
        {hasMessages && messages.some(m => m.speaker === 'person_a') && messages.some(m => m.speaker === 'person_b') && (
          <div className="px-4 pb-3 border-t border-outline-variant/20 pt-2">
            <button
              onClick={() => void endSharingPhase()}
              disabled={endingPhase}
              className="w-full py-2.5 border border-outline-variant text-on-surface-variant rounded-xl font-label-md text-sm hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {endingPhase
                ? <><svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Generating summaries…</>
                : <><span className="material-symbols-outlined text-[16px]">summarize</span> We&apos;ve both shared enough — review summaries</>
              }
            </button>
          </div>
        )}
      </div>

      {/* Reframe modal */}
      {pendingReview && (
        <ReframeModal
          review={pendingReview}
          onUseReframe={() => {
            void submitMessage(pendingContent, true)
            setPendingReview(null)
            setPendingContent('')
          }}
          onEdit={() => {
            setTextInput(pendingContent)
            setPendingReview(null)
            setPendingContent('')
          }}
          onShareAsWritten={() => {
            void submitMessage(pendingContent, false)
            setPendingReview(null)
            setPendingContent('')
          }}
          onClose={() => { setPendingReview(null); setPendingContent('') }}
        />
      )}
    </main>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Conversation progress">
      <ol className="flex items-center gap-1 overflow-x-auto">
        {PROGRESS_STEPS.map((step, i) => (
          <li key={i} className="flex items-center gap-1 shrink-0">
            <span className={`text-[11px] font-label-sm px-2 py-0.5 rounded-full whitespace-nowrap ${
              i === currentStep
                ? 'bg-secondary text-white'
                : i < currentStep
                  ? 'bg-primary-container/40 text-on-surface-variant'
                  : 'text-outline'
            }`}>
              {step.label}
            </span>
            {i < PROGRESS_STEPS.length - 1 && (
              <span className="text-outline text-[11px]">→</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function SummaryReviewView({
  speakerName, summary, editedSummary, setEditedSummary, onApprove, approvingState, error,
}: {
  speakerName: string
  summary: DbTogetherTurnSummary | null
  editedSummary: string
  setEditedSummary: (v: string) => void
  onApprove: () => void
  approvingState: 'idle' | 'loading' | 'error'
  error: string
}) {
  return (
    <main className="flex-grow w-full max-w-2xl mx-auto px-margin-mobile pt-stack-md pb-stack-lg flex flex-col gap-6">
      <div className="text-center">
        <p className="font-label-sm text-outline uppercase tracking-widest mb-2">Summary</p>
        <h2 className="font-headline-md text-on-surface">What Urushi understood from {speakerName}</h2>
        <p className="font-body-md text-on-surface-variant mt-1">Review and edit if anything is missing or inaccurate.</p>
      </div>

      {summary ? (
        <>
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-5">
            <textarea
              value={editedSummary}
              onChange={e => setEditedSummary(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-outline-variant p-4 font-body-md text-on-surface leading-relaxed resize-none focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              aria-label="Summary to approve"
            />
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container p-4 rounded-xl" role="alert">{error}</div>
          )}

          <button
            onClick={onApprove}
            disabled={!editedSummary.trim() || approvingState === 'loading'}
            className="w-full py-4 bg-secondary text-white rounded-xl font-bold font-label-md transition-all active:scale-95 disabled:opacity-60"
          >
            {approvingState === 'loading' ? 'Approving…' : `That captures ${speakerName}'s position ✓`}
          </button>
        </>
      ) : (
        <div className="flex items-center justify-center py-12 flex-col gap-3">
          <svg className="animate-spin h-8 w-8 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="font-body-md text-on-surface-variant">Urushi is reading the conversation…</p>
        </div>
      )}
    </main>
  )
}

function SharingConfirmationView({
  personAName, personBName, aConfirmed, bConfirmed, onConfirm, loading, error,
}: {
  personAName: string
  personBName: string
  aConfirmed: boolean
  bConfirmed: boolean
  onConfirm: (sp: TogetherSpeaker) => void
  loading: boolean
  error: string
}) {
  return (
    <main className="flex-grow w-full max-w-lg mx-auto px-margin-mobile pt-stack-md pb-stack-lg flex flex-col gap-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h2 className="font-headline-md text-on-surface mb-2">Before moving on</h2>
        <p className="font-body-md text-on-surface-variant">Each person, please confirm you&apos;ve been heard.</p>
      </div>

      {error && <div className="bg-error-container text-on-error-container p-4 rounded-xl" role="alert">{error}</div>}

      <div className="space-y-3">
        {([
          { name: personAName, sp: 'person_a' as TogetherSpeaker, confirmed: aConfirmed },
          { name: personBName, sp: 'person_b' as TogetherSpeaker, confirmed: bConfirmed },
        ]).map(({ name, sp, confirmed }) => (
          <div key={sp} className={`rounded-xl border p-5 ${confirmed ? 'bg-primary-container/20 border-primary/40' : 'bg-surface-container-lowest border-outline-variant'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${confirmed ? 'bg-primary' : 'bg-outline-variant'}`}>
                {confirmed
                  ? <span className="material-symbols-outlined text-white text-[16px]">check</span>
                  : <span className="font-bold text-white text-label-sm">{name[0]}</span>}
              </div>
              <p className="font-label-md text-on-surface font-semibold">{name}</p>
            </div>
            {!confirmed && (
              <button
                onClick={() => onConfirm(sp)}
                disabled={loading}
                className="w-full py-3 bg-secondary text-white rounded-xl font-bold font-label-md transition-all active:scale-95 disabled:opacity-60"
              >
                {loading ? 'Confirming…' : `${name}: I'm ready to continue`}
              </button>
            )}
            {confirmed && <p className="font-body-md text-on-surface-variant text-sm">Ready ✓</p>}
          </div>
        ))}
      </div>
    </main>
  )
}

function ReframeModal({ review, onUseReframe, onEdit, onShareAsWritten, onClose }: {
  review: MessageReview
  onUseReframe: () => void
  onEdit: () => void
  onShareAsWritten: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary text-[24px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          <div>
            <h3 className="font-headline-sm text-on-surface mb-1">Urushi suggests a reframe</h3>
            <p className="font-body-md text-on-surface-variant text-sm">{review.reason}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-outline hover:text-on-surface" aria-label="Close">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {review.suggestedReframe && (
          <div className="bg-surface-container-low rounded-xl p-4 border border-secondary/20">
            <p className="font-label-sm text-secondary uppercase tracking-widest text-[11px] mb-2">Suggested version</p>
            <p className="font-body-md text-on-surface leading-relaxed">{review.suggestedReframe}</p>
          </div>
        )}

        <div className="space-y-2">
          {review.suggestedReframe && (
            <button onClick={onUseReframe} className="w-full py-3 bg-secondary text-white rounded-xl font-bold font-label-md transition-all active:scale-95">
              Use Urushi&apos;s version
            </button>
          )}
          <button onClick={onEdit} className="w-full py-3 border border-outline-variant rounded-xl font-label-md text-on-surface hover:bg-surface-container-low transition-all">
            Edit my message
          </button>
          <button onClick={onShareAsWritten} className="w-full py-3 text-on-surface-variant font-label-md hover:text-on-surface transition-colors text-sm">
            Share as written
          </button>
        </div>
      </div>
    </div>
  )
}
