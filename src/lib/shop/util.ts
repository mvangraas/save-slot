import { createHash, randomBytes, randomInt } from 'node:crypto'
export { estimateFor } from './estimate'

/** No 0/O, 1/I/L: easy to read out over the phone. */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function referenceNumber(prefix: 'SS' | 'RS'): string {
  let s = ''
  for (let i = 0; i < 6; i++) s += ALPHABET[randomInt(ALPHABET.length)]
  return `${prefix}-${s}`
}

export const isReference = (prefix: 'SS' | 'RS', v: string) =>
  new RegExp(`^${prefix}-[${ALPHABET}]{6}$`).test(v)

/** A secret for "view your order/repair" links; only its hash is stored. */
export function newAccessToken() {
  const token = randomBytes(24).toString('base64url')
  return { token, hash: hashToken(token) }
}
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export function orderTotals(
  lines: { unitPriceCents: number; quantity: number }[],
  shippingCents: number,
  freeShippingFromCents: number | null,
) {
  const subtotalCents = lines.reduce((n, l) => n + l.unitPriceCents * l.quantity, 0)
  const shipping =
    freeShippingFromCents !== null && subtotalCents >= freeShippingFromCents ? 0 : shippingCents
  return { subtotalCents, shippingCents: shipping, totalCents: subtotalCents + shipping }
}

export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

/** Factual categories only (no prices): the owner sets prices and durations in the admin. */
export const REPAIR_DEVICES = [
  { slug: 'game-boy', name: 'Game Boy (original, DMG)' },
  { slug: 'game-boy-pocket', name: 'Game Boy Pocket' },
  { slug: 'game-boy-light', name: 'Game Boy Light' },
  { slug: 'game-boy-color', name: 'Game Boy Color' },
  { slug: 'cartridge', name: 'Game Boy / Game Boy Color cartridge' },
] as const

export const REPAIR_ISSUES = [
  {
    slug: 'screen',
    name: 'Screen or screen lens',
    description: 'Cracked or scratched lens, missing lines, dim or dead display.',
  },
  {
    slug: 'battery',
    name: 'Battery compartment & power',
    description: 'Corroded contacts, no power, switch or power jack problems.',
  },
  {
    slug: 'buttons',
    name: 'Buttons',
    description: 'Sticky, unresponsive or missing buttons and membranes.',
  },
  {
    slug: 'sound',
    name: 'Sound',
    description: 'No sound, crackling speaker or broken headphone jack.',
  },
  {
    slug: 'connector',
    name: 'Cartridge slot or link port',
    description: 'Games do not load reliably, damaged connector or link port.',
  },
  {
    slug: 'save-battery',
    name: 'Cartridge save battery',
    description: 'Save files are lost: the save battery in a cartridge is empty.',
  },
  {
    slug: 'software',
    name: 'Game will not start',
    description: 'Freezes, glitches or a cartridge that does not boot.',
  },
  {
    slug: 'other',
    name: 'Something else',
    description: 'Describe the problem and we will take a look.',
  },
] as const
