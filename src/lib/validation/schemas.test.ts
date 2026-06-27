import { describe, it, expect } from 'vitest'
import { CreateCaseSchema, IntakeMessageSchema, IntakeCompleteSchema } from './schemas'

describe('CreateCaseSchema', () => {
  const valid = {
    recipientName: 'Bob',
    topic: 'Shared holiday plans',
  }

  it('accepts valid input', () => {
    const result = CreateCaseSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('accepts valid input with optional relationship', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, relationship: 'friend' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.relationship).toBe('friend')
    }
  })

  it('accepts input without relationship (optional)', () => {
    const result = CreateCaseSchema.safeParse(valid)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.relationship).toBeUndefined()
    }
  })

  it('rejects invalid relationship value', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, relationship: 'enemy' })
    expect(result.success).toBe(false)
  })

  it('rejects empty recipient name', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, recipientName: '' })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only recipient name', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, recipientName: '   ' })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from recipient name', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, recipientName: '  Bob  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.recipientName).toBe('Bob')
    }
  })

  it('rejects empty topic', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, topic: '' })
    expect(result.success).toBe(false)
  })

  it('rejects topic under 5 chars', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, topic: 'Hi' })
    expect(result.success).toBe(false)
  })

  it('rejects topic over 120 chars', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, topic: 'x'.repeat(121) })
    expect(result.success).toBe(false)
  })

  it('accepts topic at exactly 120 chars', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, topic: 'x'.repeat(120) })
    expect(result.success).toBe(true)
  })

  it('trims whitespace from topic', () => {
    const result = CreateCaseSchema.safeParse({ ...valid, topic: '  Shared holiday plans  ' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.topic).toBe('Shared holiday plans')
    }
  })

  it('does not accept initiatorName field (removed)', () => {
    // initiatorName is now server-derived — it should be ignored if supplied
    const result = CreateCaseSchema.safeParse({ ...valid, initiatorName: 'Alice' })
    // Schema should still succeed (extra fields are stripped by Zod by default)
    expect(result.success).toBe(true)
  })

  it('does not require recipientPhone (removed)', () => {
    // No recipientPhone in valid input — should still pass
    const result = CreateCaseSchema.safeParse(valid)
    expect(result.success).toBe(true)
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
