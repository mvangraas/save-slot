import { LEGAL_TEXTS, type LegalDoc } from '@/content/legal'
import { readShopConfig, type ShopConfig } from '@/config/shop'

const TEST_LEGAL = 'TEST TEXT for automated tests only. This is not a legal document.'

export function legalText(doc: LegalDoc, env: Record<string, string | undefined> = process.env) {
  const test = env.SHOP_TEST_MODE === '1' && env.E2E === '1' && env.VERCEL_ENV !== 'production'
  return LEGAL_TEXTS[doc] ?? (test ? TEST_LEGAL : null)
}

export type Availability = { open: boolean; missing: string[] }

/** Checkout needs real business details, published terms/privacy/shipping texts and Mollie. */
export function checkoutAvailability(cfg: ShopConfig = readShopConfig()): Availability {
  const missing: string[] = []
  if (!cfg.business) missing.push('business details')
  if (cfg.shippingCents === null) missing.push('shipping costs')
  for (const doc of ['terms', 'privacy', 'shipping-returns'] as const) {
    if (!legalText(doc)) missing.push(`${doc} text`)
  }
  if (!cfg.mollie) missing.push('payment provider')
  return { open: missing.length === 0, missing }
}

/** Repair requests collect personal data, so they need business details and a privacy text. */
export function repairAvailability(cfg: ShopConfig = readShopConfig()): Availability {
  const missing: string[] = []
  if (!cfg.business) missing.push('business details')
  if (!legalText('privacy')) missing.push('privacy text')
  return { open: missing.length === 0, missing }
}
