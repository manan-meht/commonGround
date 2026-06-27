import { z } from 'zod'

// ─── Relationship enum ─────────────────────────────────────────────────────────
export const RELATIONSHIP_OPTIONS = [
  'partner_or_spouse',
  'family_member',
  'friend',
  'colleague',
  'business_partner',
  'manager_or_employee',
  'other',
] as const

export type RelationshipType = typeof RELATIONSHIP_OPTIONS[number]

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  partner_or_spouse: 'Partner or spouse',
  family_member: 'Family member',
  friend: 'Friend',
  colleague: 'Colleague',
  business_partner: 'Business partner',
  manager_or_employee: 'Manager or employee',
  other: 'Other',
}

// ─── Case creation ─────────────────────────────────────────────────────────────
export const CreateCaseSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .min(1, "The other person's name is required.")
    .max(80),
  relationship: z.enum(RELATIONSHIP_OPTIONS).optional(),
  topic: z
    .string()
    .trim()
    .min(5, 'Please describe the topic in at least 5 characters.')
    .max(120, 'Topic must be 120 characters or fewer.'),
  consentVersion: z.string().optional().default('1.0'),
})

export type CreateCaseInput = z.infer<typeof CreateCaseSchema>

// ─── Intake message ────────────────────────────────────────────────────────────
export const IntakeMessageSchema = z.object({
  content: z.string().min(1).max(4000, 'Message is too long.'),
})

export type IntakeMessageInput = z.infer<typeof IntakeMessageSchema>

// ─── Intake complete ───────────────────────────────────────────────────────────
export const IntakeCompleteSchema = z.object({
  summary: z.string().min(10, 'Summary is too short.').max(16000),
  consented: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to continue.' }),
  }),
})

export type IntakeCompleteInput = z.infer<typeof IntakeCompleteSchema>

// ─── Invitation acceptance ─────────────────────────────────────────────────────
export const AcceptInvitationSchema = z.object({
  recipientName: z.string().min(1, 'Please enter your name.').max(80).optional(),
})

export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>

// ─── Agreement response ────────────────────────────────────────────────────────
export const AgreementResponseSchema = z.object({
  agreementId: z.string().uuid(),
  response: z.enum(['agreed', 'needs_modification', 'not_agreed']),
  note: z.string().max(1000).optional(),
})

export type AgreementResponseInput = z.infer<typeof AgreementResponseSchema>

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const ReportFeedbackSchema = z.object({
  representationRating: z.enum(['accurately', 'partly', 'not']),
  freeTextCorrection: z.string().max(2000).optional(),
  mostUsefulRecommendation: z.string().max(500).optional(),
  readyToTalkDirectly: z.boolean(),
})

export type ReportFeedbackInput = z.infer<typeof ReportFeedbackSchema>
