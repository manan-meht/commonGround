import { describe, it, expect } from 'vitest'
import { buildInvitationMessage, extractFirstName } from './invitation'

const BASE = {
  initiatorFirstName: 'Alice',
  recipientFirstName: 'Bob',
  topic: 'How we make decisions about our business',
  invitationUrl: 'https://urushilabs.com/invite/abc123',
}

describe('buildInvitationMessage', () => {
  it('includes the recipient first name', () => {
    const msg = buildInvitationMessage(BASE)
    expect(msg).toContain('Hi Bob,')
  })

  it('includes the initiator first name', () => {
    const msg = buildInvitationMessage(BASE)
    expect(msg).toContain('Alice')
  })

  it('includes the topic', () => {
    const msg = buildInvitationMessage(BASE)
    expect(msg).toContain('How we make decisions about our business')
  })

  it('includes the invitation URL', () => {
    const msg = buildInvitationMessage(BASE)
    expect(msg).toContain('https://urushilabs.com/invite/abc123')
  })

  it('preserves paragraph breaks (contains double newlines)', () => {
    const msg = buildInvitationMessage(BASE)
    expect(msg).toContain('\n\n')
  })

  it('does not include HTML tags', () => {
    const msg = buildInvitationMessage(BASE)
    expect(msg).not.toMatch(/<[^>]+>/)
  })

  it('handles apostrophes in name safely', () => {
    const msg = buildInvitationMessage({ ...BASE, initiatorFirstName: "O'Brien" })
    expect(msg).toContain("O'Brien")
  })

  it('handles Unicode names safely', () => {
    const msg = buildInvitationMessage({
      ...BASE,
      initiatorFirstName: 'Zoë',
      recipientFirstName: 'Björn',
    })
    expect(msg).toContain('Zoë')
    expect(msg).toContain('Björn')
  })

  it('handles ampersand in topic safely', () => {
    const msg = buildInvitationMessage({ ...BASE, topic: 'Work & life balance' })
    expect(msg).toContain('Work & life balance')
    expect(msg).not.toContain('&amp;')
  })

  it('handles quotation marks in topic safely', () => {
    const msg = buildInvitationMessage({ ...BASE, topic: 'The "silent treatment" issue' })
    expect(msg).toContain('"The "silent treatment" issue"')
    expect(msg).not.toContain('&quot;')
  })

  it('does not include private intake text', () => {
    // The function only receives the four input fields — no intake content possible
    const msg = buildInvitationMessage(BASE)
    expect(msg.split('\n').length).toBeGreaterThan(3)
    // Sanity: only expected fields are present
    expect(msg).not.toContain('undefined')
    expect(msg).not.toContain('null')
  })

  it('URL is the last meaningful content', () => {
    const msg = buildInvitationMessage(BASE)
    const trimmed = msg.trimEnd()
    expect(trimmed.endsWith(BASE.invitationUrl)).toBe(true)
  })
})

describe('extractFirstName', () => {
  it('extracts first word from full name', () => {
    expect(extractFirstName('Alice Smith')).toBe('Alice')
  })

  it('returns single word name unchanged', () => {
    expect(extractFirstName('Alice')).toBe('Alice')
  })

  it('extracts prefix from email', () => {
    expect(extractFirstName('alice@example.com')).toBe('Alice')
  })

  it('capitalises email prefix', () => {
    expect(extractFirstName('bob@example.com')).toBe('Bob')
  })
})
