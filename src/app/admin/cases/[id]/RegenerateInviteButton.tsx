'use client'

import { useState } from 'react'

interface Props {
  caseId: string
}

export function RegenerateInviteButton({ caseId }: Props) {
  const [link, setLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  async function regenerate() {
    setLoading(true)
    setError('')
    setLink('')
    try {
      const res = await fetch(`/api/cases/${caseId}/regenerate-invite`, { method: 'POST' })
      const data = await res.json() as { inviteLink?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to regenerate.')
      } else {
        setLink(data.inviteLink ?? '')
      }
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => void regenerate()}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 bg-secondary-container text-on-secondary-container rounded-lg text-label-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">link</span>
        {loading ? 'Regenerating…' : 'Regenerate invite link'}
      </button>

      {error && <p className="text-error text-label-sm">{error}</p>}

      {link && (
        <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2">
          <span className="text-label-sm text-on-surface font-mono truncate flex-1">{link}</span>
          <button
            onClick={() => void copy()}
            className="shrink-0 flex items-center gap-1 text-primary text-label-sm font-medium"
          >
            <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  )
}
