import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth/adminSession'
import { getServiceClient } from '@/lib/db/client'
import { generateSecureToken, hashToken, inviteExpiresAt } from '@/lib/tokens'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authed = await isAdminAuthenticated()
  if (!authed) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const { id: caseId } = await params
  const db = getServiceClient()

  const { data: caseRow } = await db
    .from('cases')
    .select('id, public_reference, status')
    .eq('id', caseId)
    .single()

  if (!caseRow) return NextResponse.json({ error: 'Case not found.' }, { status: 404 })

  // Only regenerate if the recipient hasn't already joined
  if (!['awaiting_initiator', 'awaiting_recipient'].includes(caseRow.status)) {
    return NextResponse.json(
      { error: `Cannot regenerate invite for a case in status: ${caseRow.status}` },
      { status: 409 }
    )
  }

  const newToken = generateSecureToken()
  const newTokenHash = hashToken(newToken)
  const newExpiry = inviteExpiresAt(7)

  const { error } = await db
    .from('cases')
    .update({
      invitation_token_hash: newTokenHash,
      invite_expires_at: newExpiry.toISOString(),
    })
    .eq('id', caseId)

  if (error) {
    console.error('[regenerate-invite] DB error:', error)
    return NextResponse.json({ error: 'Failed to regenerate invite.' }, { status: 500 })
  }

  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000'
  const inviteLink = `${appUrl}/invite/${newToken}`

  return NextResponse.json({ inviteLink })
}
