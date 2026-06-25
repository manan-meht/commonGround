import { NextRequest, NextResponse } from 'next/server'
import { setAdminCookie } from '@/lib/auth/adminSession'

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string }
  const secret = process.env['CRON_SECRET']

  if (!secret || password !== secret) {
    return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
  }

  await setAdminCookie()
  return NextResponse.json({ success: true })
}
