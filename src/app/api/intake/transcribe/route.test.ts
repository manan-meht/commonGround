import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()
const mockTranscribe = vi.fn()
const mockSingle = vi.fn()

vi.mock('@/lib/auth/session', () => ({
  getSession: () => mockGetSession(),
}))

vi.mock('@/lib/ai/voice', () => ({
  transcribeAudio: (file: File) => mockTranscribe(file),
}))

vi.mock('@/lib/db/client', () => ({
  getServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => mockSingle(),
        }),
      }),
    }),
  }),
}))

import { POST } from './route'

const SESSION = { participantId: 'p1', caseId: 'c1', caseReference: 'ref', role: 'initiator' as const }

function makeRequest(form?: FormData) {
  return {
    formData: async () => {
      if (!form) throw new Error('no form')
      return form
    },
  } as unknown as import('next/server').NextRequest
}

function audioForm(opts: { type?: string; size?: number } = {}) {
  const size = opts.size ?? 1000
  const blob = new Blob([new Uint8Array(size)], { type: opts.type ?? 'audio/webm' })
  const file = new File([blob], 'note.webm', { type: opts.type ?? 'audio/webm' })
  const form = new FormData()
  form.append('audio', file)
  return form
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue(SESSION)
  mockSingle.mockResolvedValue({ data: { case_id: 'c1', intake_completed_at: null } })
  mockTranscribe.mockResolvedValue('transcribed text')
})

describe('POST /api/intake/transcribe', () => {
  it('rejects unauthenticated requests with 401', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await POST(makeRequest(audioForm()))
    expect(res.status).toBe(401)
  })

  it('rejects when participant does not belong to the case (403)', async () => {
    mockSingle.mockResolvedValue({ data: { case_id: 'other-case', intake_completed_at: null } })
    const res = await POST(makeRequest(audioForm()))
    expect(res.status).toBe(403)
  })

  it('rejects when intake already completed (409)', async () => {
    mockSingle.mockResolvedValue({ data: { case_id: 'c1', intake_completed_at: '2025-01-01' } })
    const res = await POST(makeRequest(audioForm()))
    expect(res.status).toBe(409)
  })

  it('rejects missing audio with 422', async () => {
    const res = await POST(makeRequest(new FormData()))
    expect(res.status).toBe(422)
  })

  it('rejects oversized audio with 413', async () => {
    const res = await POST(makeRequest(audioForm({ size: 21 * 1024 * 1024 })))
    expect(res.status).toBe(413)
  })

  it('rejects disallowed MIME type with 415', async () => {
    const res = await POST(makeRequest(audioForm({ type: 'application/json' })))
    expect(res.status).toBe(415)
  })

  it('transcribes valid audio and returns the transcript', async () => {
    const res = await POST(makeRequest(audioForm()))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.transcript).toBe('transcribed text')
    expect(mockTranscribe).toHaveBeenCalledOnce()
  })

  it('returns 500 when transcription throws', async () => {
    mockTranscribe.mockRejectedValue(new Error('openai down'))
    const res = await POST(makeRequest(audioForm()))
    expect(res.status).toBe(500)
  })
})
