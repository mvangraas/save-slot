import type { RepairCatalog, RepairPrice } from './types'

/** The owner's price/duration indication for a device + problem, or null (on request). */
export function estimateFor(
  catalog: Pick<RepairCatalog, 'prices'>,
  deviceId: string,
  issueId: string,
): Omit<RepairPrice, 'deviceId' | 'issueId'> | null {
  const p = catalog.prices.find((x) => x.deviceId === deviceId && x.issueId === issueId)
  if (!p || (p.priceFromCents === null && p.daysMin === null)) return null
  const { deviceId: _d, issueId: _i, ...rest } = p
  void _d
  void _i
  return rest
}
