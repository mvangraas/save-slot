import { getShopStore } from '@/lib/shop'
import { getMollie, syncPayment } from '@/lib/shop/payments'

/**
 * Mollie calls this with only a payment id. We never trust the request itself: the payment's
 * status is fetched from Mollie with our API key. Unknown ids get a 200 too, so attackers learn
 * nothing; real failures return 500 so Mollie retries.
 */
export async function POST(request: Request) {
  const mollie = getMollie()
  if (!mollie) return new Response('Payments are not configured', { status: 503 })
  const form = await request.formData().catch(() => null)
  const id = String(form?.get('id') ?? '')
  if (!/^tr_\w{4,40}$/.test(id)) return new Response('ok')
  try {
    await syncPayment(getShopStore(), mollie, id)
    return new Response('ok')
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTTP 404')) return new Response('ok')
    console.error('[mollie webhook]', error)
    return new Response('error', { status: 500 })
  }
}
