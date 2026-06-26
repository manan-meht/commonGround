import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { PRODUCTS, type ProductKey } from '@/lib/db/credits'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const { paymentId, razorpayPaymentId, razorpaySignature } = body as {
    paymentId?: string
    razorpayPaymentId?: string
    razorpaySignature?: string
  }

  if (!paymentId) return NextResponse.json({ error: 'paymentId is required.' }, { status: 422 })

  const db = getServiceClient()

  const { data: payment } = await db
    .from('payments')
    .select('id, user_id, product_key, status, razorpay_order_id')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .single()

  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 })
  if (payment.status === 'completed') return NextResponse.json({ error: 'Payment already processed.' }, { status: 409 })

  // TODO: When Razorpay is integrated, verify the signature here:
  // const expectedSignature = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET)
  //   .update(`${payment.razorpay_order_id}|${razorpayPaymentId}`)
  //   .digest('hex')
  // if (expectedSignature !== razorpaySignature) {
  //   await db.from('payments').update({ status: 'failed' }).eq('id', paymentId)
  //   return NextResponse.json({ error: 'Signature verification failed.' }, { status: 400 })
  // }

  const productKey = payment.product_key as ProductKey
  const product = PRODUCTS[productKey]

  // Mark payment completed
  await db.from('payments').update({
    status: 'completed',
    razorpay_payment_id: razorpayPaymentId ?? null,
    razorpay_signature: razorpaySignature ?? null,
  }).eq('id', paymentId)

  // Credit the user's account atomically
  const { error: creditError } = await db.rpc('add_user_credits', {
    p_user_id: user.id,
    p_rooms: product.rooms,
    p_follow_ups: product.followUps,
  })

  if (creditError) {
    console.error('[verify] Failed to add credits:', creditError)
    // Payment is marked complete — credits will need manual reconciliation.
    // Do not fail the response; log for ops review.
  }

  return NextResponse.json({ success: true, productKey, credits: { rooms: product.rooms, followUps: product.followUps } })
}
