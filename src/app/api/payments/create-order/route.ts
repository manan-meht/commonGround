import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/db/client'
import { getOrCreateCredits, PRODUCTS, type ProductKey } from '@/lib/db/credits'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const productKey = (body as { productKey?: string }).productKey as ProductKey
  if (!productKey || !(productKey in PRODUCTS)) {
    return NextResponse.json({ error: 'Invalid product.' }, { status: 422 })
  }

  const product = PRODUCTS[productKey]
  const db = getServiceClient()

  // Ensure credits record exists
  await getOrCreateCredits(user.id)

  // Create a pending payment record
  const { data: payment, error } = await db
    .from('payments')
    .insert({
      user_id: user.id,
      product_key: productKey,
      amount_paise: product.amountPaise,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !payment) {
    console.error('[create-order] DB error:', error)
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
  }

  // TODO: When Razorpay is integrated, create a Razorpay order here and
  // store razorpay_order_id on the payment record. Return the order details
  // for the Razorpay checkout SDK to open.

  return NextResponse.json({
    paymentId: payment.id,
    productKey,
    amountPaise: product.amountPaise,
    label: product.label,
    // razorpayOrderId: '...',  // populated once Razorpay is integrated
  })
}
