'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { InvitationBrief } from '@/lib/db/types'

interface Props {
  caseId: string
  caseReference: string
  initiatorName: string
  recipientName: string
  initialBrief: InvitationBrief | null
  initialApprovedAt: string | null
}

function personalise(text: string, recipientName: string): string {
  // Replace the recipient's name with "you"/"your" so the message reads naturally
  // when the recipient reads it, rather than in third person.
  const escaped = recipientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text
    .replace(new RegExp(`\\b${escaped}'s\\b`, 'gi'), 'your')
    .replace(new RegExp(`\\b${escaped}\\b`, 'gi'), 'you')
}

function buildInviteMessage(
  initiatorName: string,
  recipientName: string,
  brief: InvitationBrief,
  inviteLink: string,
): string {
  return `Hi ${recipientName},

${initiatorName} has asked you to join a private, structured conversation through Urushi Labs — a confidential space designed to help people work through situations constructively.

Here's what the conversation is about:

${personalise(brief.reasonForConversation, recipientName)}

${personalise(brief.issueFromPartyAPerspective, recipientName)}

${personalise(brief.hopedForOutcome, recipientName)}

${personalise(brief.invitationToRespond, recipientName)}

You can join here:
${inviteLink}

Nothing has been decided yet. You'll have a full opportunity to share your own perspective privately before anything is shared between both parties.

— Urushi Labs`
}

export function BriefReview({
  caseId,
  caseReference,
  initiatorName,
  recipientName,
  initialBrief,
  initialApprovedAt,
}: Props) {
  const router = useRouter()
  const [brief, setBrief] = useState<InvitationBrief | null>(initialBrief)
  const [approvedAt, setApprovedAt] = useState<string | null>(initialApprovedAt)
  const [loading, setLoading] = useState(!initialBrief && !initialApprovedAt)
  const [loadingTimedOut, setLoadingTimedOut] = useState(false)
  const [approving, setApproving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [inviteLink, setInviteLink] = useState('')

  useEffect(() => {
    setInviteLink(sessionStorage.getItem('cg_invite_link') ?? '')
  }, [])

  // On mount: if no brief exists yet, generate it directly rather than waiting
  // for the background waitUntil task (which may not have completed in time).
  useEffect(() => {
    if (!loading) return
    let cancelled = false

    async function generate() {
      try {
        const res = await fetch(`/api/cases/${caseId}/brief`, { method: 'POST' })
        if (cancelled) return
        const data = await res.json() as { brief?: InvitationBrief; error?: string }
        if (res.ok && data.brief) {
          setBrief(data.brief)
          setLoading(false)
        } else {
          setError(data.error ?? 'Failed to generate invitation brief.')
          setLoadingTimedOut(true)
        }
      } catch {
        if (!cancelled) {
          setError('A network error occurred. Please try again.')
          setLoadingTimedOut(true)
        }
      }
    }

    void generate()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRegenerate() {
    setRegenerating(true)
    setError('')
    try {
      const res = await fetch(`/api/cases/${caseId}/brief`, { method: 'POST' })
      const data = await res.json() as { brief?: InvitationBrief; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to regenerate brief.')
      } else if (data.brief) {
        setBrief(data.brief)
        setApprovedAt(null)
      }
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setRegenerating(false)
    }
  }

  async function handleApprove() {
    setApproving(true)
    setError('')
    try {
      const res = await fetch(`/api/cases/${caseId}/brief/approve`, { method: 'POST' })
      const data = await res.json() as { approvedAt?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to approve brief.')
      } else if (data.approvedAt) {
        setApprovedAt(data.approvedAt)
      }
    } catch {
      setError('A network error occurred. Please try again.')
    } finally {
      setApproving(false)
    }
  }

  async function handleCopyMessage() {
    if (!brief || !inviteLink) return
    const message = buildInviteMessage(initiatorName, recipientName, brief, inviteLink)
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function handleShareWhatsApp() {
    if (!brief || !inviteLink) return
    const message = buildInviteMessage(initiatorName, recipientName, brief, inviteLink)
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  function handleShareGmail() {
    if (!brief || !inviteLink) return
    const subject = `${initiatorName} has invited you to a private conversation`
    const message = buildInviteMessage(initiatorName, recipientName, brief, inviteLink)
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-6">
        {!loadingTimedOut ? (
          <>
            <div className="w-16 h-16 bg-primary-container/30 rounded-full flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="font-headline-sm text-on-surface mb-2">Preparing the invitation for {recipientName}…</h2>
              <p className="text-on-surface-variant font-body-md">Urushi Labs is drafting a neutral summary of your conversation. This takes about 15 seconds.</p>
            </div>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-outline text-5xl">hourglass_disabled</span>
            <div className="text-center">
              <h2 className="font-headline-sm text-on-surface mb-2">Taking longer than expected</h2>
              <p className="text-on-surface-variant font-body-md mb-4">The draft didn&apos;t arrive in time. Tap below to generate it now.</p>
              <button
                onClick={() => void handleRegenerate()}
                disabled={regenerating}
                className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md font-bold hover:bg-on-primary-fixed-variant transition-all active:scale-95 disabled:opacity-60"
              >
                {regenerating ? 'Generating…' : 'Generate invitation'}
              </button>
              {error && <p className="text-error text-label-sm mt-3">{error}</p>}
            </div>
          </>
        )}
      </main>
    )
  }

  if (approvedAt) {
    const inviteMessage = brief && inviteLink
      ? buildInviteMessage(initiatorName, recipientName, brief, inviteLink)
      : null

    return (
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="bg-primary-container/30 border border-primary/20 rounded-2xl p-5 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          <div>
            <p className="font-label-md text-on-surface font-semibold">Invitation ready to share</p>
            <p className="text-label-sm text-on-surface-variant mt-1">Copy the message below and send it to {recipientName} however you like.</p>
          </div>
        </div>

        {inviteMessage ? (
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden">
            <div className="bg-secondary-container/20 px-5 py-3 border-b border-outline-variant flex items-center justify-between">
              <p className="font-label-sm text-on-surface-variant uppercase tracking-widest text-[11px]">Message to send {recipientName}</p>
            </div>
            <pre className="p-5 font-body-md text-on-surface whitespace-pre-wrap leading-relaxed text-sm">{inviteMessage}</pre>
          </div>
        ) : (
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
            <p className="text-on-surface-variant font-body-md">Invite link not available. Check your original confirmation email.</p>
          </div>
        )}

        {inviteMessage && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => void handleCopyMessage()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-xl font-label-md font-bold hover:bg-on-primary-fixed-variant transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">{copied ? 'check' : 'content_copy'}</span>
              {copied ? 'Copied to clipboard!' : 'Copy message'}
            </button>

            <p className="text-label-sm text-on-surface-variant text-center">
              The message is pre-filled on WhatsApp and Gmail — just pick who to send it to.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] py-3 rounded-xl font-label-md hover:bg-[#25D366]/10 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </button>

              <button
                onClick={handleShareGmail}
                className="flex items-center justify-center gap-2 border-2 border-outline-variant text-on-surface py-3 rounded-xl font-label-md hover:bg-surface-container-low transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
                </svg>
                Gmail
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => router.push(`/case/${caseReference}/waiting`)}
          className="text-center text-primary font-label-md hover:underline py-2"
        >
          Continue to waiting room →
        </button>
      </main>
    )
  }

  return (
    <main className="flex-1 w-full max-w-xl mx-auto px-4 py-8 flex flex-col gap-6">
      <div>
        <h1 className="font-headline-md text-on-surface mb-2">Review what {recipientName} will receive</h1>
        <p className="text-on-surface-variant font-body-md">
          This is the Invitation Brief that {recipientName} will see before joining the conversation. It is based on your account, but written in neutral language to give them fair context. Review it carefully before sending.
        </p>
        <p className="text-label-sm text-on-surface-variant/70 mt-2">
          Your full private summary will not be shared with {recipientName}.
        </p>
      </div>

      {error && (
        <div className="bg-error-container/20 border border-error-container rounded-xl p-4 text-on-error-container font-body-md text-sm">
          {error}
        </div>
      )}

      {brief && (
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden">
          <div className="bg-secondary-container/30 px-5 py-3 border-b border-outline-variant">
            <p className="font-label-sm text-on-surface font-semibold">{brief.title}</p>
          </div>
          <div className="p-5 flex flex-col gap-5">
            <section>
              <p className="font-label-sm text-outline uppercase tracking-widest text-[11px] mb-2">Why this conversation was started</p>
              <p className="font-body-md text-on-surface-variant leading-relaxed">{brief.reasonForConversation}</p>
            </section>
            <section>
              <p className="font-label-sm text-outline uppercase tracking-widest text-[11px] mb-2">The issue as you currently understand it</p>
              <p className="font-body-md text-on-surface-variant leading-relaxed">{brief.issueFromPartyAPerspective}</p>
            </section>
            <section>
              <p className="font-label-sm text-outline uppercase tracking-widest text-[11px] mb-2">What you hope the conversation can achieve</p>
              <p className="font-body-md text-on-surface-variant leading-relaxed">{brief.hopedForOutcome}</p>
            </section>
            <section className="bg-primary-container/10 rounded-xl p-4">
              <p className="font-label-sm text-outline uppercase tracking-widest text-[11px] mb-2">Invitation to {recipientName}</p>
              <p className="font-body-md text-on-surface-variant leading-relaxed">{brief.invitationToRespond}</p>
            </section>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => void handleApprove()}
          disabled={approving || !brief}
          className="w-full bg-primary text-on-primary py-4 rounded-xl font-label-md font-bold hover:bg-on-primary-fixed-variant transition-all active:scale-95 disabled:opacity-60"
        >
          {approving ? 'Approving…' : `Approve and invite ${recipientName}`}
        </button>
        <button
          onClick={() => void handleRegenerate()}
          disabled={regenerating}
          className="w-full border border-outline-variant text-on-surface py-3 rounded-xl font-label-md hover:bg-surface-container-low transition-colors disabled:opacity-60"
        >
          {regenerating ? 'Regenerating…' : 'Generate a different version'}
        </button>
        <button
          onClick={() => router.push(`/case/${caseReference}/intake`)}
          className="text-center text-on-surface-variant font-label-md hover:text-on-surface transition-colors py-2"
        >
          ← Return to your conversation
        </button>
      </div>
    </main>
  )
}
