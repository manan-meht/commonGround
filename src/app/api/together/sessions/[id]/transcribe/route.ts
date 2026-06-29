import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/db/client'
import { transcribeAudio } from '@/lib/ai/voice'
import { ALLOWED_AUDIO_MIME_TYPES, MAX_AUDIO_BYTES } from '@/lib/voice'
import { verifyTogetherAccess } from '@/lib/together/verifyAccess'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const access = await verifyTogetherAccess(id)
  if (!access) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  const db = getServiceClient()

  const { data: session } = await db
    .from('together_sessions')
    .select('id, stage, current_speaker')
    .eq('id', id)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })

  if (!['person_a_sharing', 'person_b_sharing'].includes(session.stage)) {
    return NextResponse.json({ error: 'Not in a sharing stage.' }, { status: 409 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const audioEntry = formData.get('audio')
  if (!audioEntry || !(audioEntry instanceof File)) {
    return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 })
  }

  if (audioEntry.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Audio file is too large (max 20 MB).' }, { status: 413 })
  }

  if (!(ALLOWED_AUDIO_MIME_TYPES as readonly string[]).includes(audioEntry.type)) {
    return NextResponse.json({ error: 'Unsupported audio format.' }, { status: 415 })
  }

  try {
    const transcript = await transcribeAudio(audioEntry)
    return NextResponse.json({ transcript })
  } catch (err) {
    console.error('[together/transcribe] Transcription failed:', err)
    return NextResponse.json({ error: 'Transcription failed. Please try again.' }, { status: 500 })
  }
}
