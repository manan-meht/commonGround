import { describe, it, expect } from 'vitest'
import { SharedReportSchema, SAFETY_CATEGORIES } from './mediationPrompt'
import { MOCK_REPORT } from './mockReport'

describe('SharedReportSchema', () => {
  it('validates the mock report without errors', () => {
    const result = SharedReportSchema.safeParse(MOCK_REPORT)
    expect(result.success).toBe(true)
  })

  it('requires reportTitle', () => {
    const bad = { ...MOCK_REPORT, reportTitle: '' }
    const result = SharedReportSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it('rejects invalid safety category', () => {
    const bad = { ...MOCK_REPORT, safetyCategory: 'made_up_category' }
    const result = SharedReportSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it('requires valid initiatorPerspective shape', () => {
    const bad = { ...MOCK_REPORT, initiatorPerspective: { wrong: 'field' } }
    const result = SharedReportSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it('accepts null for professionalSupportSuggestion', () => {
    const ok = { ...MOCK_REPORT, professionalSupportSuggestion: null }
    const result = SharedReportSchema.safeParse(ok)
    expect(result.success).toBe(true)
  })
})

describe('safety category classification', () => {
  const SAFE = ['ordinary_conflict', 'high_conflict']
  const SAFETY_SENSITIVE = [
    'possible_coercion_or_abuse',
    'possible_self_harm_or_violence',
    'possible_child_safety_issue',
    'legal_or_professional_support_needed',
  ]

  it('all expected categories are present in SAFETY_CATEGORIES', () => {
    expect(SAFETY_CATEGORIES).toContain('ordinary_conflict')
    expect(SAFETY_CATEGORIES).toContain('possible_coercion_or_abuse')
    expect(SAFETY_CATEGORIES).toContain('possible_self_harm_or_violence')
    expect(SAFETY_CATEGORIES).toContain('possible_child_safety_issue')
    expect(SAFETY_CATEGORIES).toContain('legal_or_professional_support_needed')
  })

  it('can distinguish ordinary from safety-sensitive categories', () => {
    const isSafetySensitive = (cat: string) => SAFETY_SENSITIVE.includes(cat)
    SAFE.forEach((cat) => expect(isSafetySensitive(cat)).toBe(false))
    SAFETY_SENSITIVE.forEach((cat) => expect(isSafetySensitive(cat)).toBe(true))
  })
})
