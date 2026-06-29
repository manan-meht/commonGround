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

// ─── Together Mode ────────────────────────────────────────────────────────────
export const CreateTogetherSessionSchema = z.object({
  personAName: z.string().trim().min(1, 'Person A name is required.').max(80),
  personBName: z.string().trim().min(1, 'Person B name is required.').max(80),
  topic: z
    .string()
    .trim()
    .min(5, 'Please describe the topic in at least 5 characters.')
    .max(120, 'Topic must be 120 characters or fewer.'),
  relationship: z.enum(RELATIONSHIP_OPTIONS).optional(),
  deviceMode: z.enum(['shared', 'separate']).default('shared'),
})
export type CreateTogetherSessionInput = z.infer<typeof CreateTogetherSessionSchema>

export const TogetherConsentSchema = z.object({
  confirmedSafety: z.literal(true, {
    errorMap: () => ({ message: 'All participants must feel safe to continue.' }),
  }),
})
export type TogetherConsentInput = z.infer<typeof TogetherConsentSchema>

export const TogetherMessageSchema = z.object({
  content: z.string().min(1).max(4000, 'Message is too long.'),
  speaker: z.enum(['person_a', 'person_b']),
  replyToId: z.string().uuid().optional(),
  useReframe: z.boolean().optional(),
})
export type TogetherMessageInput = z.infer<typeof TogetherMessageSchema>

export const TogetherSummaryApprovalSchema = z.object({
  approvedSummary: z.string().min(1).max(4000),
})
export type TogetherSummaryApprovalInput = z.infer<typeof TogetherSummaryApprovalSchema>

export const TogetherReadinessSchema = z.object({
  speaker: z.enum(['person_a', 'person_b']),
})
export type TogetherReadinessInput = z.infer<typeof TogetherReadinessSchema>

export const TogetherIssueUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: z.enum(['pending', 'discussing', 'agreed', 'partial', 'unresolved', 'skipped']).optional(),
  resolution: z.string().max(2000).optional(),
})
export type TogetherIssueUpdateInput = z.infer<typeof TogetherIssueUpdateSchema>

export const TogetherOptionSchema = z.object({
  proposedBy: z.enum(['person_a', 'person_b', 'urushi']),
  description: z.string().min(1).max(2000),
})
export type TogetherOptionInput = z.infer<typeof TogetherOptionSchema>

export const TogetherOptionResponseSchema = z.object({
  speaker: z.enum(['person_a', 'person_b']),
  response: z.enum(['accept', 'accept_with_changes', 'reject', 'need_info']),
  note: z.string().max(1000).optional(),
})
export type TogetherOptionResponseInput = z.infer<typeof TogetherOptionResponseSchema>

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const ReportFeedbackSchema = z.object({
  representationRating: z.enum(['accurately', 'partly', 'not']),
  freeTextCorrection: z.string().max(2000).optional(),
  mostUsefulRecommendation: z.string().max(500).optional(),
  readyToTalkDirectly: z.boolean(),
})

export type ReportFeedbackInput = z.infer<typeof ReportFeedbackSchema>
