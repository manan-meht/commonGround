import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetSession = vi.fn()
const mockSynthesize = vi.fn()
const mockSingle = vi.fn()
const mockDecrypt = vi.fn()

vi.mock('@/lib/auth/session', () => ({
  getSession: () => mockGetSession(),
}))

vi.mock('@/lib/ai/voice', () => ({
  synthesizeSpeech: (text: string) => mockSynthesize(text),
}))

vi.mock('@/lib/crypto', () => ({
  decryptFromDb: (row: unknown) => mockDecrypt(row),
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

import { GET } from './route'

const SESSION = { participantId: 'p1', caseId: 'c1', caseReference: 'ref', role: 'initiator' as const }
const ASSISTANT_MSG = {
  id: 'm1',
  case_id: 'c1',
  role: 'assistant',
  encrypted_content: 'x',
  encryption_iv: 'y',
  encryption_tag: 'z',
}

const req = {} as unknown as import('next/server').NextRequest
function params(messageId: string) {
  return { params: Promise.resolve({ messageId }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue(SESSION)
  mockSingle.mockResolvedValue({ data: ASSISTANT_MSG })
  mockDecrypt.mockReturnValue('Hello there.')
  mockSynthesize.mockResolvedValue(Buffer.from([1, 2, 3]))
})

describe('GET /api/intake/messages/[messageId]/speech', () => {
  it('rejects unauthenticated requests with 401', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await GET(req, params('m1'))
    expect(res.status).toBe(401)
  })

  it('returns 404 when the message is missing', async () => {
    mockSingle.mockResolvedValue({ data: null })
    const res = await GET(req, params('m1'))
    expect(res.status).toBe(404)
  })

  it('returns 404 when the message belongs to a different case', async () => {
    mockSingle.mockResolvedValue({ data: { ...ASSISTANT_MSG, case_id: 'other' } })
    const res = await GET(req, params('m1'))
    expect(res.status).toBe(404)
  })

  it('rejects non-assistant messages with 400', async () => {
    mockSingle.mockResolvedValue({ data: { ...ASSISTANT_MSG, role: 'participant' } })
    const res = await GET(req, params('m1'))
    expect(res.status).toBe(400)
  })

  it('returns audio/mpeg with no-store caching for a valid assistant message', async () => {
    const res = await GET(req, params('m1'))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg')
    expect(res.headers.get('Cache-Control')).toBe('private, no-store')
    expect(mockSynthesize).toHaveBeenCalledWith('Hello there.')
  })

  it('returns 500 when synthesis throws', async () => {
    mockSynthesize.mockRejectedValue(new Error('tts down'))
    const res = await GET(req, params('m1'))
    expect(res.status).toBe(500)
  })
})
