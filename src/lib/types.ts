/** Mirrors the Postgres enums planned in the master prompt (§7). */
export type Platform = 'gb' | 'gbc'
/** gb = grey DMG cart · gbc_dual = black, plays on both · gbc_only = clear, GBC only */
export type CartCompat = 'gb' | 'gbc_dual' | 'gbc_only'
export type Region = 'eu' | 'us' | 'jp'

export const platformLabel: Record<Platform, string> = {
  gb: 'Game Boy',
  gbc: 'Game Boy Color',
}

export const compatLabel: Record<CartCompat, string> = {
  gb: 'Game Boy',
  gbc_dual: 'Game Boy Color (dual-mode)',
  gbc_only: 'Game Boy Color only',
}

export const regionLabel: Record<Region, string> = {
  eu: 'Europe',
  us: 'North America',
  jp: 'Japan',
}

export function platformOf(compat: CartCompat): Platform {
  return compat === 'gb' ? 'gb' : 'gbc'
}
