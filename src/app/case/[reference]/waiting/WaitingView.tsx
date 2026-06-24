'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  caseReference: string
  caseId: string
  status: string
  topic: string
  role: 'initiator' | 'recipient'
  recipientName: string
  completedCount: number
  whatsAppUrl?: string
  inviteLink?: string
}

export function WaitingView({
  caseReference,
  caseId,
  status,
  topic,
  role,
  recipientName,
  completedCount: initialCount,
  whatsAppUrl,
  inviteLink: inviteLinkProp,
}: Props) {
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState(status)
  const [completedCount, setCompletedCount] = useState(initialCount)
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState<string>(inviteLinkProp ?? '')

  const isGenerating = ['ready_for_analysis', 'analysing'].includes(currentStatus)
  const isReportReady = ['report_ready', 'needs_safety_review'].includes(currentStatus)

  useEffect(() => {
    if (!inviteLinkProp) {
      const stored = sessionStorage.getItem('cg_invite_link')
      if (stored) setInviteLink(stored)
    }
  }, [inviteLinkProp])

  // Poll for status updates — faster when analysis is in progress
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

  async function copyLink() {
    const link = inviteLink || window.location.href
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

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
        <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-base active-pulse">
          <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface">Your perspective is submitted</h1>
        <p className="text-on-surface-variant max-w-[300px]">
          {topic}
        </p>
      </div>

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

      {/* Share section (initiator only) */}
      {role === 'initiator' && (whatsAppUrl || inviteLink) && (
        <div className="w-full space-y-4 mb-stack-md">
          <p className="font-label-sm text-outline uppercase tracking-widest">Share the invitation</p>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 px-6 rounded-lg font-bold flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-md"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Share invitation on WhatsApp
          </a>
          <button
            onClick={() => void copyLink()}
            className="w-full bg-white border border-outline-variant text-primary py-4 px-6 rounded-lg font-bold flex items-center justify-center gap-3 transition-all hover:bg-surface-container-low active:opacity-70"
          >
            <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : 'Copy invite link'}
          </button>
        </div>
      )}

      <div className="flex gap-3 p-4 bg-surface-container-low rounded-lg items-start border border-outline-variant/30 w-full">
        <span className="material-symbols-outlined text-secondary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
        <p className="text-label-sm text-on-surface-variant">
          <strong>Privacy Shield:</strong> Your private perspective is encrypted. The other participant cannot access your submission at any point.
        </p>
      </div>
    </main>
  )
}
