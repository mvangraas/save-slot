import 'server-only'

/**
 * Minimal Mollie Payments API client (https://docs.mollie.com/reference/payments-api).
 * Only the server talks to Mollie; the API key never reaches the browser. Payment status is
 * always read back from Mollie itself, so a forged webhook call cannot mark an order as paid.
 */
export type MolliePayment = {
  id: string
  status: 'open' | 'pending' | 'authorized' | 'paid' | 'canceled' | 'expired' | 'failed'
  checkoutUrl: string | null
  amount: { value: string; currency: string }
  metadata: { orderId?: string } | null
}

export const centsToMollie = (cents: number) => (cents / 100).toFixed(2)

export function mollieClient(cfg: { apiKey: string; apiBase: string }, fetchImpl = fetch) {
  async function call(path: string, init?: RequestInit) {
    const res = await fetchImpl(`${cfg.apiBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`Mollie ${path}: HTTP ${res.status}`)
    return (await res.json()) as Record<string, unknown>
  }
  const toPayment = (j: Record<string, unknown>): MolliePayment => ({
    id: String(j.id),
    status: j.status as MolliePayment['status'],
    checkoutUrl:
      ((j._links as Record<string, { href?: string }> | undefined)?.checkout?.href as string) ??
      null,
    amount: j.amount as MolliePayment['amount'],
    metadata: (j.metadata as MolliePayment['metadata']) ?? null,
  })
  return {
    async createPayment(p: {
      amountCents: number
      description: string
      redirectUrl: string
      webhookUrl: string | null
      orderId: string
    }) {
      const body = {
        amount: { currency: 'EUR', value: centsToMollie(p.amountCents) },
        description: p.description,
        redirectUrl: p.redirectUrl,
        ...(p.webhookUrl ? { webhookUrl: p.webhookUrl } : {}),
        metadata: { orderId: p.orderId },
      }
      return toPayment(await call('/payments', { method: 'POST', body: JSON.stringify(body) }))
    },
    async getPayment(id: string) {
      if (!/^tr_\w+$/.test(id)) throw new Error('invalid payment id')
      return toPayment(await call(`/payments/${id}`))
    },
  }
}
