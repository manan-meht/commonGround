import { describe, it, expect } from 'vitest'
import { CreateCaseSchema, IntakeMessageSchema, IntakeCompleteSchema } from './schemas'

describe('CreateCaseSchema', () => {
  const valid = {
    initiatorName: 'Alice',
    initiatorContact: 'alice@example.com',
    recipientName: 'Bob',
    recipientPhone: '+442071234567',
    topic: 'Shared holiday plans',
  }

  it('accepts valid input', () => {
    const result = CreateCaseSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('normalises UK phone to E.164', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, recipientPhone: '+44 207 123 4567' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.recipientPhone).toBe('+442071234567')
    }
  })

  it('rejects invalid phone number', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, recipientPhone: 'not-a-phone' })
    expect(result.success).toBe(false)
  })

  it('rejects empty topic', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, topic: '' })
    expect(result.success).toBe(false)
  })

  it('rejects topic over 500 chars', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, topic: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('rejects empty initiator name', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, initiatorName: '' })
    expect(result.success).toBe(false)
  })
})

describe('IntakeMessageSchema', () => {
  it('accepts a valid message', () => {
    const result = IntakeMessageSchema.safeParse({ content: 'This is my perspective.' })
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    const result = IntakeMessageSchema.safeParse({ content: '' })
    expect(result.success).toBe(false)
  })

  it('rejects messages over 4000 chars', () => {
    const result = IntakeMessageSchema.safeParse({ content: 'x'.repeat(4001) })
    expect(result.success).toBe(false)
  })
})

describe('IntakeCompleteSchema', () => {
  it('accepts valid complete payload', () => {
    const result = IntakeCompleteSchema.safeParse({
      summary: 'This is a summary that is long enough.',
      consented: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejects consented=false', () => {
    const result = IntakeCompleteSchema.safeParse({
      summary: 'Valid summary text here.',
      consented: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects short summary', () => {
    const result = IntakeCompleteSchema.safeParse({
      summary: 'short',
      consented: true,
    })
    expect(result.success).toBe(false)
  })
})
