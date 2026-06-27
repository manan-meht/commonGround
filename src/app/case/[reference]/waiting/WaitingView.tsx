'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { buildInvitationMessage } from '@/lib/invitation'

interface Props {
  caseReference: string
  caseId: string
  status: string
  topic: string
  role: 'initiator' | 'recipient'
  initiatorName: string
  recipientName: string
  completedCount: number
  inviteLink?: string
  emailSubject: string
}

export function WaitingView({
  caseReference,
  caseId,
  status,
  topic,
  role,
  initiatorName,
  recipientName,
  completedCount: initialCount,
  inviteLink: inviteLinkProp,
  emailSubject,
}: Props) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState(status)
  const [completedCount, setCompletedCount] = useState(initialCount)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [inviteLink, setInviteLink] = useState<string>(inviteLinkProp ?? '')

  const isGenerating = ['ready_for_analysis', 'analysing'].includes(currentStatus)
  const isReportReady = ['report_ready', 'needs_safety_review'].includes(currentStatus)

  useEffect(() => {
    if (!inviteLinkProp) {
      const stored = sessionStorage.getItem('cg_invite_link')
      if (stored) setInviteLink(stored)
    }
  }, [inviteLinkProp])

  // Poll for status updates
  useEffect(() => {
    const pollInterval = isGenerating ? 3000 : 8000

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cases/${caseId}/status`)
        if (res.ok) {
          const data = await res.json() as { status: string; completedParticipantCount: number }
          setCurrentStatus(data.status)
          setCompletedCount(data.completedParticipantCount)

          if (['report_ready', 'needs_safety_review'].includes(data.status)) {
            router.push(`/case/${caseReference}/report`)
          }
        }
      } catch {
        // ignore polling errors
      }
    }, pollInterval)

    return () => clearInterval(interval)
  }, [caseId, caseReference, router, isGenerating])

  const invitationMessage = inviteLink
    ? buildInvitationMessage({
        initiatorFirstName: initiatorName,
        recipientFirstName: recipientName,
        topic,
        invitationUrl: inviteLink,
      })
    : ''

  const whatsAppUrl = invitationMessage
    ? `https://wa.me/?text=${encodeURIComponent(invitationMessage)}`
    : undefined

  const emailUrl = invitationMessage
    ? `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(invitationMessage)}`
    : undefined

  const copyMessage = useCallback(async () => {
    if (!invitationMessage) return
    try {
      await navigator.clipboard.writeText(invitationMessage)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 2500)
    } catch {
      // Clipboard API unavailable — fallback: select a textarea
      setCopyState('error')
      setTimeout(() => setCopyState('idle'), 3000)
    }
  }, [invitationMessage])

  const steps = [
    { label: 'You shared your perspective', done: true, active: false },
    {
      label: role === 'initiator' ? `Waiting for ${recipientName} to join` : 'Waiting for both perspectives',
      done: completedCount >= 2,
      active: completedCount < 2,
    },
    { label: 'Shared report being generated', done: isReportReady, active: isGenerating },
  ]

  return (
    <main className="flex-grow w-full max-w-container-max flex flex-col items-center px-margin-mobile pt-stack-md pb-stack-lg mx-auto">

      {/* Success header */}
      <div className="flex flex-col items-center text-center gap-base mb-stack-md">
        <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-base">
          <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface">Your perspective is submitted</h1>
        <p className="text-on-surface-variant max-w-[320px] font-body-md">{topic}</p>
      </div>

      {/* Invitation section (initiator only) */}
      {role === 'initiator' && inviteLink && (
        <section className="w-full mb-stack-md" aria-label="Invite the other participant">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 space-y-5">

            {/* Heading */}
            <div>
              <h2 className="font-headline-md text-on-surface mb-1">Invite {recipientName}</h2>
              <p className="font-body-md text-on-surface-variant">
                Send this invitation so {recipientName} can share their perspective privately.
              </p>
            </div>

            {/* Topic */}
            <div className="bg-secondary-container/20 rounded-lg p-4">
              <p className="font-label-sm text-outline uppercase tracking-widest mb-1">Conversation topic</p>
              <p className="font-body-md text-on-surface">{topic}</p>
            </div>

            <p className="text-label-sm text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
              Your private responses will not be included in the invitation.
            </p>

            {/* Generated message preview */}
            <div>
              <p className="font-label-sm text-outline uppercase tracking-widest mb-2">Invitation message</p>
              <div className="bg-surface-container-low rounded-lg p-4 text-label-md text-on-surface-variant leading-relaxed whitespace-pre-wrap font-mono text-[13px] max-h-48 overflow-y-auto border border-outline-variant/30">
                {invitationMessage}
              </div>
            </div>

            {/* Copy error fallback */}
            {copyState === 'error' && (
              <p className="text-error text-label-sm" role="alert">
                Could not access clipboard. Please select and copy the message above manually.
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Copy message — primary */}
              <button
                onClick={() => void copyMessage()}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-on-primary rounded-xl font-bold font-label-md transition-all active:scale-95 shadow-sm"
                aria-label="Copy invitation message to clipboard"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {copyState === 'copied' ? 'check' : 'content_copy'}
                </span>
                {copyState === 'copied' ? 'Copied!' : 'Copy invitation message'}
              </button>

              {/* WhatsApp */}
              {whatsAppUrl && (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-bold font-label-md transition-all active:scale-95"
                  aria-label="Share invitation on WhatsApp"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Share on WhatsApp
                </a>
              )}

              {/* Email */}
              {emailUrl && (
                <a
                  href={emailUrl}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-white border border-outline-variant text-on-surface rounded-xl font-bold font-label-md hover:bg-surface-container-low transition-all active:scale-95"
                  aria-label="Share invitation by email"
                >
                  <span className="material-symbols-outlined text-[20px]">mail</span>
                  Share by email
                </a>
              )}
            </div>

            {/* Invite later */}
            <div className="text-center">
              <Link
                href="/dashboard"
                className="text-label-sm text-on-surface-variant hover:text-on-surface transition-colors underline underline-offset-2"
              >
                I&apos;ll invite them later
              </Link>
              <p className="text-label-sm text-outline mt-1">The invitation link will remain available from your dashboard.</p>
            </div>
          </div>
        </section>
      )}

      {/* Status timeline */}
      <section className="w-full bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant mb-stack-md">
        <h3 className="font-label-sm text-label-sm text-outline uppercase mb-4 tracking-widest">Progress</h3>
        <div className="flex flex-col gap-6">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className={`z-10 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                step.done
                  ? 'bg-primary'
                  : step.active
                    ? 'bg-secondary'
                    : 'bg-outline-variant opacity-50'
              }`}>
                {step.done ? (
                  <span className="material-symbols-outlined text-white text-[14px]">check</span>
                ) : step.active ? (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                ) : (
                  <span className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div className={step.active ? 'opacity-100' : step.done ? 'opacity-100' : 'opacity-50'}>
                <p className={`font-label-md text-label-md ${step.active ? 'text-primary font-bold' : 'text-on-surface'}`}>
                  {step.label}
                </p>
                {step.active && isGenerating && (
                  <p className="text-label-sm text-on-surface-variant animate-pulse">Analysing both perspectives…</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3 p-4 bg-surface-container-low rounded-lg items-start border border-outline-variant/30 w-full">
        <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
        <p className="text-label-sm text-on-surface-variant">
          <strong>Privacy:</strong> Your private perspective is encrypted. The other participant cannot access your submission at any point.
        </p>
      </div>
    </main>
  )
}

