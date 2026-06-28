import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { decryptFromDb } from '@/lib/crypto'
import { synthesizeSpeech } from '@/lib/ai/voice'
import type { DbIntakeMessage } from '@/lib/db/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const { messageId } = await params

  const db = getServiceClient()
  const { data: message } = await db
    .from('intake_messages')
    .select('*')
    .eq('id', messageId)
    .single<DbIntakeMessage>()

  // Must exist, belong to this participant's case, and be an assistant message.
  if (!message || message.case_id !== session.caseId) {
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
  }
  if (message.role !== 'assistant') {
    return NextResponse.json({ error: 'Only assistant messages can be voiced.' }, { status: 400 })
  }

  let content: string
  try {
    content = decryptFromDb(message)
  } catch {
    return NextResponse.json({ error: 'Message could not be read.' }, { status: 500 })
  }

  try {
    const audio = await synthesizeSpeech(content)
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[GET /api/intake/messages/[messageId]/speech] Error:', (err as Error).message)
    return NextResponse.json({ error: 'Failed to generate speech.' }, { status: 500 })
  }
}
