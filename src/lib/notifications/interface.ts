export type NotificationTemplate =
  | 'recipient_invitation'
  | 'intake_reminder'
  | 'report_ready'

export interface NotificationPayload {
  template: NotificationTemplate
  to: string           // phone (E.164) or email
  recipientName: string
  initiatorName: string
  topic: string
  link: string         // participant-specific secure link
  caseReference: string
}

export interface NotificationResult {
  success: boolean
  providerId?: string
  error?: string
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationResult>
  isConfigured(): boolean
}
