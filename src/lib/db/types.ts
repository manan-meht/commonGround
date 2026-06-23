/** Database type definitions matching the Supabase schema. */

export type CaseStatus =
  | 'draft'
  | 'awaiting_initiator'
  | 'awaiting_recipient'
  | 'ready_for_analysis'
  | 'analysing'
  | 'report_ready'
  | 'needs_safety_review'
  | 'declined'
  | 'closed'

export type ParticipantRole = 'initiator' | 'recipient'

export type MessageRole = 'participant' | 'assistant'

export type AnalysisStatus = 'pending' | 'running' | 'complete' | 'failed'

export type SafetyCategory =
  | 'ordinary_conflict'
  | 'high_conflict'
  | 'possible_coercion_or_abuse'
  | 'possible_self_harm_or_violence'
  | 'possible_child_safety_issue'
  | 'legal_or_professional_support_needed'

export type NotificationChannel = 'whatsapp' | 'email' | 'sms' | 'in_app'

export type NotificationStatus = 'queued' | 'sent' | 'delivered' | 'failed'

export type AgreementResponse = 'agreed' | 'needs_modification' | 'not_agreed'

export interface DbCase {
  id: string
  public_reference: string
  topic: string
  status: CaseStatus
  initiator_name: string
  recipient_name: string
  initiator_email: string | null
  initiator_phone: string | null
  recipient_email: string | null
  recipient_phone: string
  consent_version: string
  invitation_token_hash: string | null
  invite_expires_at: string | null
  created_at: string
  updated_at: string
  analysis_started_at: string | null
  analysis_completed_at: string | null
  closed_at: string | null
}

export interface DbParticipant {
  id: string
  case_id: string
  role: ParticipantRole
  display_name: string
  email: string | null
  phone: string | null
  access_token_hash: string
  invitation_accepted_at: string | null
  consented_at: string | null
  intake_completed_at: string | null
  last_accessed_at: string | null
  created_at: string
}

export interface DbIntakeMessage {
  id: string
  case_id: string
  participant_id: string
  role: MessageRole
  encrypted_content: string
  encryption_iv: string
  encryption_tag: string
  sequence_number: number
  created_at: string
}

export interface DbSubmission {
  id: string
  case_id: string
  participant_id: string
  encrypted_summary: string
  encryption_iv: string
  encryption_tag: string
  submitted_at: string
  consented_for_shared_analysis: boolean
  revision_number: number
}

export interface DbAnalysis {
  id: string
  case_id: string
  status: AnalysisStatus
  model: string | null
  prompt_version: string | null
  structured_result: SharedReport | null
  safety_category: SafetyCategory | null
  safety_explanation: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface DbAgreement {
  id: string
  case_id: string
  analysis_id: string
  agreement_text: string
  initiator_response: AgreementResponse | null
  recipient_response: AgreementResponse | null
  initiator_note: string | null
  recipient_note: string | null
  created_at: string
  updated_at: string
}

export interface DbNotificationLog {
  id: string
  case_id: string
  participant_id: string | null
  channel: NotificationChannel
  template_name: string
  provider_message_id: string | null
  status: NotificationStatus
  error_message: string | null
  sent_at: string | null
  created_at: string
}

export interface DbAuditEvent {
  id: string
  case_id: string | null
  participant_id: string | null
  event_type: string
  metadata: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

// ─── Shared Report (stored in analyses.structured_result JSONB) ───────────────
export interface SharedReport {
  reportTitle: string
  neutralOverview: string
  agreedFacts: string[]
  disputedInterpretations: DisputedInterpretation[]
  initiatorPerspective: PerspectiveSummary
  recipientPerspective: PerspectiveSummary
  pointsOfAgreement: string[]
  sharedGoals: string[]
  misunderstandings: string[]
  intentionVsImpact: IntentionVsImpact[]
  initiatorNeeds: string[]
  recipientNeeds: string[]
  initiatorAccountability: string[]
  recipientAccountability: string[]
  recommendedNextSteps: NextStep[]
  suggestedOpeningScript: string
  conversationGuidelines: string[]
  possibleAgreements: string[]
  unresolvedIssues: string[]
  professionalSupportSuggestion: string | null
  safetyCategory: SafetyCategory
  safetyExplanation: string
  reportLimitations: string
}

export interface DisputedInterpretation {
  event: string
  initiatorView: string
  recipientView: string
}

export interface PerspectiveSummary {
  coreFeelings: string[]
  mainConcerns: string[]
  coreNeed: string
  paraphrase: string
}

export interface IntentionVsImpact {
  actor: 'initiator' | 'recipient'
  intendedMessage: string
  perceivedImpact: string
}

export interface NextStep {
  action: string
  owner: 'initiator' | 'recipient' | 'both'
  timeframe: string | null
}
