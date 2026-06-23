import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getServiceClient } from '@/lib/db/client'
import { AgreementResponseSchema } from '@/lib/validation/schemas'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: caseId } = await params

  const session = await getSession()
  if (!session || session.caseId !== caseId) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const parsed = AgreementResponseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 })
  }

  const { agreementId, response, note } = parsed.data
  const { role } = session
  const db = getServiceClient()

  const responseField = role === 'initiator' ? 'initiator_response' : 'recipient_response'
  const noteField = role === 'initiator' ? 'initiator_note' : 'recipient_note'

  const { data: agreement } = await db
    .from('agreements')
    .select('id')
    .eq('id', agreementId)
    .eq('case_id', caseId)
    .single()

  if (!agreement) {
    return NextResponse.json({ error: 'Agreement not found.' }, { status: 404 })
  }

  await db
    .from('agreements')
    .update({ [responseField]: response, [noteField]: note ?? null })
    .eq('id', agreementId)

  return NextResponse.json({ success: true })
}
