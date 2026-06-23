/**
 * Notification service with provider fallback chain.
 * Server-only.
 */

import { WhatsAppProvider } from './whatsapp'
import { EmailProvider } from './email'
import type { NotificationPayload, NotificationResult } from './interface'
import { getServiceClient } from '@/lib/db/client'

const isDev = process.env['NODE_ENV'] !== 'production'

export async function sendNotification(
  payload: NotificationPayload & { caseId: string; participantId?: string; channel: 'whatsapp' | 'email' }
): Promise<NotificationResult> {
  const { caseId, participantId, channel, ...notifPayload } = payload
  let result: NotificationResult

  try {
    if (channel === 'whatsapp') {
      const provider = new WhatsAppProvider()
      if (provider.isConfigured()) {
        result = await provider.send(notifPayload)
      } else {
        if (isDev) {
          console.warn(`[Notification] WhatsApp not configured. Skipping send to ${payload.to}. Template: ${payload.template}.`)
        }
        result = { success: false, error: 'WhatsApp not configured' }
      }
    } else {
      const provider = new EmailProvider()
      if (provider.isConfigured()) {
        result = await provider.send(notifPayload)
      } else {
        if (isDev) {
          console.warn(`[Notification] Email not configured. Skipping send. Template: ${payload.template}.`)
        }
        result = { success: false, error: 'Email not configured' }
      }
    }
  } catch (err) {
    result = {
      success: false,
      error: err instanceof Error ? err.message : 'Notification error',
    }
    console.error('[Notification] Unexpected error:', result.error)
  }

  // Log to DB without throwing — notification failure must not break analysis
  try {
    const db = getServiceClient()
    await db.from('notification_logs').insert({
      case_id: caseId,
      participant_id: participantId ?? null,
      channel,
      template_name: payload.template,
      provider_message_id: result.providerId ?? null,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error ?? null,
      sent_at: result.success ? new Date().toISOString() : null,
    })
  } catch {
    // log to DB is best-effort
  }

  return result
}
