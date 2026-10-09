import type { CartCompat, Platform, Region } from '@/lib/types'
import type { CollectionItem } from './types'

export type OwnedGame = {
  gameId: string
  slug: string
  title: string
  platform: Platform
  compat: CartCompat
  firstReleaseYear: number | null
  regions: Region[]
  copies: number
  cib: boolean
  addedAt: string
}

const regionOrder: Region[] = ['eu', 'us', 'jp']

/** Copies → one entry per game, newest first. */
export function groupByGame(items: CollectionItem[]): OwnedGame[] {
  const map = new Map<string, OwnedGame>()
  for (const i of items) {
    const g = map.get(i.gameId)
    const cib = i.hasCart && i.hasBox && i.hasManual
    if (!g) {
      map.set(i.gameId, {
        gameId: i.gameId,
        slug: i.gameSlug,
        title: i.gameTitle,
        platform: i.platform,
        compat: i.compat,
        firstReleaseYear: i.firstReleaseYear,
        regions: [i.region],
        copies: 1,
        cib,
        addedAt: i.createdAt,
      })
    } else {
      g.copies++
      g.cib ||= cib
      if (!g.regions.includes(i.region)) g.regions.push(i.region)
      if (i.createdAt > g.addedAt) g.addedAt = i.createdAt
    }
  }
  return [...map.values()]
    .map((g) => ({ ...g, regions: regionOrder.filter((r) => g.regions.includes(r)) }))
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
}

export function ownedPerPlatform(games: OwnedGame[]): Record<Platform, number> {
  return {
    gb: games.filter((g) => g.platform === 'gb').length,
    gbc: games.filter((g) => g.platform === 'gbc').length,
  }
}

const csvCell = (v: unknown): string => {
  if (v === null || v === undefined) return ''
  let s = String(v)
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

export function collectionToCsv(items: CollectionItem[]): string {
  const header = [
    'title',
    'platform',
    'cartridge_type',
    'region',
    'regional_title',
    'has_cart',
    'has_box',
    'has_manual',
    'condition',
    'paid',
    'currency',
    'bought_on',
    'notes',
    'added_at',
  ]
  const rows = items.map((i) => [
    i.gameTitle,
    i.platform,
    i.compat,
    i.region,
    i.localTitle,
    i.hasCart,
    i.hasBox,
    i.hasManual,
    i.condition,
    i.purchasePriceCents == null ? null : (i.purchasePriceCents / 100).toFixed(2),
    i.purchaseCurrency,
    i.purchasedOn,
    i.notes,
    i.createdAt,
  ])
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
