import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { encryptSummaryToDb } from '@/lib/crypto'
import { IntakeCompleteSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = IntakeCompleteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { summary, consented } = parsed.data
  if (!consented) {
    return NextResponse.json({ error: 'Consent is required.' }, { status: 422 })
  }

  const { participantId, caseId } = session

  try {
    const db = getServiceClient()

    // Check not already completed
    const { data: participant } = await db
      .from('participants')
      .select('intake_completed_at')
      .eq('id', participantId)
      .single()

    if (participant?.intake_completed_at) {
      return NextResponse.json({ error: 'Intake already completed.' }, { status: 409 })
    }

    // Encrypt and store the summary
    const encrypted = encryptSummaryToDb(summary)
    await db.from('submissions').insert({
      case_id: caseId,
      participant_id: participantId,
      encrypted_summary: encrypted.encrypted_summary,
      encryption_iv: encrypted.encryption_iv,
      encryption_tag: encrypted.encryption_tag,
      consented_for_shared_analysis: true,
      revision_number: 1,
    })

    // Mark intake as complete
    await db
      .from('participants')
      .update({ intake_completed_at: new Date().toISOString() })
      .eq('id', participantId)

    // Audit
    await db.from('audit_events').insert({
      case_id: caseId,
      participant_id: participantId,
      event_type: 'intake_completed',
      metadata: null,
    })

    // Check if both participants have now completed their intake
    const { data: participants } = await db
      .from('participants')
      .select('id, role, intake_completed_at')
      .eq('case_id', caseId)

    const allComplete =
      participants &&
      participants.length === 2 &&
      participants.every((p) => !!p.intake_completed_at)

    if (allComplete) {
      await db
        .from('cases')
        .update({ status: 'ready_for_analysis' })
        .eq('id', caseId)
        .eq('status', 'awaiting_recipient')

      await db.from('audit_events').insert({
        case_id: caseId,
        event_type: 'ready_for_analysis',
        metadata: null,
      })

      // Trigger analysis immediately — fire and forget so response is not delayed
      const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
      const cronSecret = process.env['CRON_SECRET']
      void fetch(`${appUrl}/api/cases/${caseId}/analyse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
        },
      }).catch((err) => console.error('[intake/complete] Failed to trigger analysis:', err))
    }

    return NextResponse.json({ success: true, readyForAnalysis: allComplete ?? false })
  } catch (err) {
    console.error('[POST /api/intake/complete] Error:', err)
    return NextResponse.json({ error: 'Failed to complete intake.' }, { status: 500 })
  }
}
