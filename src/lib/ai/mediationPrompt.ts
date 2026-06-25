/**
 * Versioned server-only analysis system prompt and output schema.
 * Never import from client components.
 */

import { z } from 'zod'
import type { SafetyCategory } from '@/lib/db/types'

export const MEDIATION_PROMPT_VERSION = '1.0'

export const SAFETY_CATEGORIES = [
  'ordinary_conflict',
  'high_conflict',
  'possible_coercion_or_abuse',
  'possible_self_harm_or_violence',
  'possible_child_safety_issue',
  'legal_or_professional_support_needed',
] as const satisfies ReadonlyArray<SafetyCategory>

// ─── Zod schema for the structured report ─────────────────────────────────────
const DisputedInterpretationSchema = z.union([
  z.object({ event: z.string(), initiatorView: z.string(), recipientView: z.string() }),
  z.string(),
])

const PerspectiveSummarySchema = z.union([
  z.object({
    coreFeelings: z.array(z.string()).optional().default([]),
    mainConcerns: z.array(z.string()).optional().default([]),
    coreNeed: z.string().optional().default(''),
    paraphrase: z.string().optional().default(''),
  }).passthrough(),
  z.string(),
])

const IntentionVsImpactSchema = z.union([
  z.object({
    actor: z.enum(['initiator', 'recipient']).optional(),
    intendedMessage: z.string(),
    perceivedImpact: z.string(),
  }),
  z.string(),
])

const NextStepSchema = z.union([
  z.object({
    action: z.string(),
    owner: z.enum(['initiator', 'recipient', 'both']).optional(),
    timeframe: z.string().nullable().optional(),
  }),
  z.string(),
])

// intentionVsImpact may come back as an array or as an object keyed by index
const intentionVsImpactField = z.preprocess((val) => {
  if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
    return Object.values(val as Record<string, unknown>)
  }
  return val
}, z.array(IntentionVsImpactSchema))

export const SharedReportSchema = z.object({
  reportTitle: z.string().min(1),
  neutralOverview: z.string(),
  agreedFacts: z.union([z.array(z.string()), z.string()]),
  disputedInterpretations: z.union([z.array(DisputedInterpretationSchema), z.string()]),
  initiatorPerspective: PerspectiveSummarySchema,
  recipientPerspective: PerspectiveSummarySchema,
  pointsOfAgreement: z.union([z.array(z.string()), z.string()]),
  sharedGoals: z.union([z.array(z.string()), z.string()]).optional().default([]),
  misunderstandings: z.union([z.array(z.string()), z.string()]),
  intentionVsImpact: intentionVsImpactField,
  initiatorNeeds: z.union([z.array(z.string()), z.string()]),
  recipientNeeds: z.union([z.array(z.string()), z.string()]),
  initiatorAccountability: z.union([z.array(z.string()), z.string()]),
  recipientAccountability: z.union([z.array(z.string()), z.string()]),
  recommendedNextSteps: z.union([z.array(NextStepSchema), z.string()]),
  suggestedOpeningScript: z.string(),
  conversationGuidelines: z.union([z.array(z.string()), z.string()]),
  possibleAgreements: z.union([z.array(z.string()), z.string()]),
  unresolvedIssues: z.union([z.array(z.string()), z.string()]),
  professionalSupportSuggestion: z.string().nullable(),
  safetyCategory: z.enum([
    'ordinary_conflict',
    'high_conflict',
    'possible_coercion_or_abuse',
    'possible_self_harm_or_violence',
    'possible_child_safety_issue',
    'legal_or_professional_support_needed',
  ]),
  safetyExplanation: z.string(),
  reportLimitations: z.string(),
})

export type ValidatedSharedReport = z.infer<typeof SharedReportSchema>

// ─── System prompt ─────────────────────────────────────────────────────────────
export interface MediationContext {
  initiatorName: string
  recipientName: string
  topic: string
  initiatorSummary: string
  recipientSummary: string
}

export function buildMediationSystemPrompt(): string {
  return `You are an impartial conflict-resolution facilitator. You are not a therapist, judge, lawyer or fact-finder.

You have been given two independently submitted accounts of the same disagreement.

Your task is to help both participants understand the disagreement and identify constructive next steps.

FUNDAMENTAL RULES:
- Do not assume that either account is completely accurate.
- Clearly distinguish observable events, interpretations, feelings, intentions and impact.
- Represent both perspectives fairly and with comparable detail, but do not manufacture equal blame.
- When one participant acknowledges a specific harmful action and the other does not, state this carefully rather than creating artificial symmetry.
- Do not diagnose either participant or use personality labels.
- Do not decide who is a good or bad person.
- Do not reveal raw private text or describe one participant's submission as "confidential evidence."
- Recommendations must be specific and behavioural. Avoid vague advice such as "communicate better."

SAFETY CLASSIFICATION:
Before producing reconciliation advice, classify the situation as one of:
- ordinary_conflict: A normal disagreement without safety concerns.
- high_conflict: Significant escalation, entrenched positions, strong emotions, but no safety concerns.
- possible_coercion_or_abuse: Signs of power imbalance, control, threats, intimidation, or fear of retaliation.
- possible_self_harm_or_violence: Any indication of suicidal ideation, self-harm, or threats of physical violence.
- possible_child_safety_issue: Any indication a child may be at risk.
- legal_or_professional_support_needed: The situation primarily requires legal, financial, or specialist professional help.

For categories 3–6 (safety-sensitive):
- Do NOT recommend ordinary compromise or joint direct confrontation.
- Do NOT create a "meet in the middle" recommendation.
- Acknowledge the serious nature of what has been described.
- Recommend qualified human professional support.
- Use the professionalSupportSuggestion field to suggest the type of professional (not country-specific numbers, as you cannot verify these) and note that emergency services should be contacted if there is immediate danger.
- Keep the reportTitle neutral and non-alarmist.

IDENTIFY:
- Agreed facts between the accounts.
- Disputed facts or interpretations.
- Shared goals.
- Different needs and expectations.
- Intention-versus-impact gaps.
- Communication patterns that contributed to escalation.
- Actions each participant could reasonably acknowledge.
- Concrete next steps.

Where an apology may be helpful, explain what it should acknowledge without forcing an admission to disputed facts.

OUTPUT FORMAT:
You must respond with a single valid JSON object. The top-level keys must be exactly:
reportTitle, neutralOverview, agreedFacts, disputedInterpretations, initiatorPerspective, recipientPerspective, pointsOfAgreement, sharedGoals, misunderstandings, intentionVsImpact, initiatorNeeds, recipientNeeds, initiatorAccountability, recipientAccountability, recommendedNextSteps, suggestedOpeningScript, conversationGuidelines, possibleAgreements, unresolvedIssues, professionalSupportSuggestion, safetyCategory, safetyExplanation, reportLimitations.
No preamble, no markdown, no wrapper object, no explanation outside the JSON.`
}

export function buildMediationUserMessage(ctx: MediationContext): string {
  return `TOPIC: ${ctx.topic}

PARTICIPANT A (${ctx.initiatorName}) — Private Summary:
${ctx.initiatorSummary}

PARTICIPANT B (${ctx.recipientName}) — Private Summary:
${ctx.recipientSummary}

Please analyse both perspectives and produce the shared resolution report JSON.`
}
