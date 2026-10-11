import { readShopConfig, vatNote } from '@/config/shop'

/** Price/VAT/shipping line under the shop. Only states what the owner has configured. */
export function ShopNotice() {
  const cfg = readShopConfig()
  const parts: string[] = []
  if (cfg.business) parts.push(vatNote[cfg.business.vatMode])
  if (cfg.shippingCents !== null) {
    parts.push(
      `Shipping within NL/BE: €${(cfg.shippingCents / 100).toFixed(2).replace('.', ',')}` +
        (cfg.freeShippingFromCents !== null
          ? `, free from €${(cfg.freeShippingFromCents / 100).toFixed(2).replace('.', ',')}`
          : '') +
        '.',
    )
  }
  if (parts.length === 0) return null
  return <p className="text-xs text-fg-muted">{parts.join(' ')}</p>
}
