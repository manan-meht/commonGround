/**
 * Resend email notification provider.
 * Server-only.
 */

import type { NotificationPayload, NotificationProvider, NotificationResult } from './interface'

const SUBJECTS: Record<string, string> = {
  recipient_invitation: 'You\'ve been invited to a facilitated conversation — Urushi Labs',
  intake_reminder: 'Reminder: Your perspective is still needed — Urushi Labs',
  report_ready: 'Your shared resolution report is ready — Urushi Labs',
}

export class EmailProvider implements NotificationProvider {
  private readonly apiKey: string
  private readonly fromAddress: string

  constructor() {
    this.apiKey = process.env['RESEND_API_KEY'] ?? ''
    this.fromAddress = process.env['EMAIL_FROM'] ?? 'noreply@example.com'
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.apiKey !== 're_placeholder')
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Email provider not configured.' }
    }

    const subject = SUBJECTS[payload.template] ?? 'Urushi Labs update'
    const html = buildEmailHtml(payload)

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to: [payload.to],
          subject,
          html,
        }),
      })

      const data = (await res.json()) as { id?: string }

      if (!res.ok) {
        return { success: false, error: `Email API error: ${res.status}` }
      }

      return { success: true, providerId: data.id }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error sending email.',
      }
    }
  }
}

function buildEmailHtml(payload: NotificationPayload): string {
  const templates: Record<string, string> = {
    recipient_invitation: `
      <p>Hi ${payload.recipientName},</p>
      <p><strong>${payload.initiatorName}</strong> has invited you to a private, AI-facilitated conversation through Urushi Labs.</p>
      <p><strong>Topic:</strong> ${payload.topic}</p>
      <p>Your perspective is kept completely private — the AI will not share your responses directly with ${payload.initiatorName}. A neutral shared report is only created once both of you have participated.</p>
      <p><a href="${payload.link}" style="background:#4a654e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View invitation</a></p>
      <p style="color:#737972;font-size:12px;">This link is personal to you and expires in 7 days. Urushi Labs is an AI communication tool, not a substitute for legal or professional advice.</p>
    `,
    intake_reminder: `
      <p>Hi ${payload.recipientName},</p>
      <p>A reminder that your perspective is still needed in your Urushi Labs conversation about: <strong>${payload.topic}</strong>.</p>
      <p><a href="${payload.link}" style="background:#4a654e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Share my perspective</a></p>
    `,
    report_ready: `
      <p>Hi ${payload.recipientName},</p>
      <p>Your shared resolution report for <strong>${payload.topic}</strong> is ready. Both participants have submitted their perspectives and the AI has generated a neutral synthesis.</p>
      <p><a href="${payload.link}" style="background:#4a654e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View the report</a></p>
      <p style="color:#737972;font-size:12px;">Urushi Labs is an AI communication tool, not a substitute for legal, therapeutic, or professional advice.</p>
    `,
  }

  const body = templates[payload.template] ?? `<p>Update on your Urushi Labs conversation. <a href="${payload.link}">Click here to view.</a></p>`

  return `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;color:#1a1c1b;background:#faf9f7;padding:32px;">${body}</body></html>`
}
