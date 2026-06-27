/**
 * Meta WhatsApp Cloud API notification provider.
 * Server-only.
 */

import type { NotificationPayload, NotificationProvider, NotificationResult } from './interface'

const TEMPLATES: Record<string, { name: string; language: string }> = {
  recipient_invitation: { name: 'cg_recipient_invitation', language: 'en_US' },
  intake_reminder: { name: 'cg_intake_reminder', language: 'en_US' },
  report_ready: { name: 'cg_report_ready', language: 'en_US' },
}

export class WhatsAppProvider implements NotificationProvider {
  private readonly accessToken: string
  private readonly phoneNumberId: string
  private readonly apiVersion: string

  constructor() {
    this.accessToken = process.env['WHATSAPP_ACCESS_TOKEN'] ?? ''
    this.phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID'] ?? ''
    this.apiVersion = process.env['WHATSAPP_API_VERSION'] ?? 'v21.0'
  }

  isConfigured(): boolean {
    return !!(this.accessToken && this.phoneNumberId)
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'WhatsApp provider not configured.' }
    }

    const template = TEMPLATES[payload.template]
    if (!template) {
      return { success: false, error: `Unknown template: ${payload.template}` }
    }

    const body = {
      messaging_product: 'whatsapp',
      to: payload.to,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: payload.recipientName },
              { type: 'text', text: payload.initiatorName },
              { type: 'text', text: payload.topic },
              { type: 'text', text: payload.link },
            ],
          },
        ],
      },
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      const data = (await res.json()) as { messages?: Array<{ id: string }> }

      if (!res.ok) {
        return { success: false, error: `WhatsApp API error: ${res.status}` }
      }

      return { success: true, providerId: data.messages?.[0]?.id }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error sending WhatsApp message.',
      }
    }
  }
}

/**
 * Builds a phone-free WhatsApp share URL with a pre-filled message.
 * The user selects the recipient inside WhatsApp.
 */
export function buildWhatsAppShareUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
