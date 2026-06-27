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

export type RelationshipType =
  | 'partner_or_spouse'
  | 'family_member'
  | 'friend'
  | 'colleague'
  | 'business_partner'
  | 'manager_or_employee'
  | 'other'

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
  recipient_phone: string | null
  relationship: RelationshipType | null
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
  bottomLine: string
  sharedGoals: string[]
  initiatorRecognition: PerspectiveRecognition
  recipientRecognition: PerspectiveRecognition
  behaviouralAssessments: BehaviouralAssessment[]
  disputedOrUnknownPoints: DisputedPoint[]
  escalationCycle: EscalationStep[]
  repairsRequired: Repair[]
  actionPlan: ActionStep[]
  suggestedWords: SuggestedWords[]
  workingAgreements: WorkingAgreement[]
  reviewPoint: ReviewPoint
  professionalSupportSuggestion: string | null
  safetyCategory: SafetyCategory
  safetyExplanation: string
  reportLimitations: string
}

export interface PerspectiveRecognition {
  validConcerns: string[]
  importantContext: string[]
  coreNeeds: string[]
  acknowledgementAlreadyOffered: string[]
}

export interface BehaviouralAssessment {
  owner: 'initiator' | 'recipient' | 'both'
  behaviour: string
  evidenceStatus: 'agreed' | 'acknowledged_by_actor' | 'reported_by_both' | 'reported_by_one' | 'disputed' | 'inference'
  assessment: 'not_acceptable' | 'needs_change' | 'reasonable' | 'cannot_determine'
  directFinding: string
  impact: string
  requiredChange: string | null
  requiredRepair: string | null
}

export interface DisputedPoint {
  issue: string
  initiatorView: string
  recipientView: string
  evidenceStatus: 'disputed'
  fairConclusion: string
}

export interface EscalationStep {
  step: number
  actor: 'initiator' | 'recipient' | 'both' | 'context'
  triggerOrInterpretation: string
  response: string
  impactOnCycle: string
}

export interface Repair {
  owner: 'initiator' | 'recipient' | 'both'
  owedTo: string
  reason: string
  acknowledgementNeeded: string
  actionNeeded: string
  mustNotRequire: string
  timeframe: string
}

export interface ActionStep {
  priority: number
  owner: 'initiator' | 'recipient' | 'both'
  action: string
  timeframe: string
  successMeasure: string
}

export interface SuggestedWords {
  speaker: 'initiator' | 'recipient'
  purpose: string
  script: string
}

export interface WorkingAgreement {
  agreement: string
  appliesTo: 'initiator' | 'recipient' | 'both'
  implementation: string
  breachResponse: string
}

export interface ReviewPoint {
  timeframe: string
  measuresOfProgress: string[]
  ifNoImprovement: string[]
}
