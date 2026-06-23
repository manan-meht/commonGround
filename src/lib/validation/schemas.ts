import { z } from 'zod'
import { parsePhoneNumber } from 'libphonenumber-js'

function normalisePhone(val: string, ctx: z.RefinementCtx): string {
  try {
    const parsed = parsePhoneNumber(val)
    if (!parsed.isValid()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid phone number. Include the country code, e.g. +1 555 555 5555.' })
      return z.NEVER
    }
    return parsed.format('E.164')
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid phone number format.' })
    return z.NEVER
  }
}

// ─── Case creation ─────────────────────────────────────────────────────────────
export const CreateCaseSchema = z.object({
  initiatorName: z.string().min(1, 'Your name is required.').max(80),
  initiatorContact: z
    .string()
    .min(1, 'Your email or phone is required.')
    .max(200),
  recipientName: z.string().min(1, "The other person's name is required.").max(80),
  recipientPhone: z
    .string()
    .min(1, "The other person's WhatsApp number is required.")
    .transform(normalisePhone),
  topic: z
    .string()
    .min(5, 'Please describe the topic in at least 5 characters.')
    .max(500, 'Topic must be 500 characters or fewer.'),
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
