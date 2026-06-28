import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { transcribeAudio } from '@/lib/ai/voice'
import { isAllowedAudioMimeType, isAllowedAudioSize } from '@/lib/voice'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Confirm the participant is still authorized to add to this intake.
  const db = getServiceClient()
  const { data: participant } = await db
    .from('participants')
    .select('case_id, intake_completed_at')
    .eq('id', session.participantId)
    .single()

  if (!participant || participant.case_id !== session.caseId) {
    return NextResponse.json({ error: 'Not authorized for this case.' }, { status: 403 })
  }
  if (participant.intake_completed_at) {
    return NextResponse.json({ error: 'Your intake has already been completed.' }, { status: 409 })
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data.' }, { status: 400 })
  }

  const file = form.get('audio')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'Audio file is required.' }, { status: 422 })
  }

  if (!isAllowedAudioSize(file.size)) {
    return NextResponse.json({ error: 'Audio file is too large (max 20 MB).' }, { status: 413 })
  }

  // Do NOT trust a client filename — validate on the reported content type.
  if (!isAllowedAudioMimeType(file.type)) {
    return NextResponse.json({ error: 'Unsupported audio format.' }, { status: 415 })
  }

  try {
    const transcript = await transcribeAudio(file)
    return NextResponse.json({ transcript })
  } catch (err) {
    // Never log audio content; log only the error.
    console.error('[POST /api/intake/transcribe] Error:', (err as Error).message)
    return NextResponse.json({ error: 'Failed to transcribe audio.' }, { status: 500 })
  }
}
