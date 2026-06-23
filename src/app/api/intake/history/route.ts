import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { decryptFromDb } from '@/lib/crypto'
import type { DbIntakeMessage } from '@/lib/db/types'

// Returns decrypted intake history for the authenticated participant only
export async function GET(_req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const db = getServiceClient()

  const { data: messages, error } = await db
    .from('intake_messages')
    .select('*')
    .eq('participant_id', session.participantId)
    .order('sequence_number', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch history.' }, { status: 500 })
  }

  const decrypted = (messages as DbIntakeMessage[]).map((m) => ({
    role: m.role,
    content: decryptFromDb(m),
    createdAt: m.created_at,
  }))

  return NextResponse.json({ messages: decrypted })
}
