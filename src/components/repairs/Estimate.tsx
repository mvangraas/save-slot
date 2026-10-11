import { formatEuro } from '@/lib/format'
import type { RepairPrice } from '@/lib/shop/types'

type Est = Pick<RepairPrice, 'priceFromCents' | 'priceToCents' | 'daysMin' | 'daysMax'> | null

export function formatEstimate(e: Est) {
  const price =
    e?.priceFromCents == null
      ? null
      : e.priceToCents != null && e.priceToCents !== e.priceFromCents
        ? `${formatEuro(e.priceFromCents)} – ${formatEuro(e.priceToCents)}`
        : `from ${formatEuro(e.priceFromCents)}`
  const days =
    e?.daysMin == null
      ? null
      : e.daysMax != null && e.daysMax !== e.daysMin
        ? `${e.daysMin}–${e.daysMax} working days`
        : `about ${e.daysMin} working day${e.daysMin === 1 ? '' : 's'}`
  return { price, days }
}

/** Always labelled as an indication; the final price is a separate, confirmed amount. */
export function EstimateText({ estimate }: { estimate: Est }) {
  const { price, days } = formatEstimate(estimate)
  return (
    <span>
      <strong>Price indication:</strong> {price ?? 'on request'}
      {' · '}
      <strong>Expected time:</strong> {days ?? 'on request'}
    </span>
  )
}
