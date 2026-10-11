export const site = {
  name: 'Save Slot',
  tagline: 'Your Game Boy collection, saved.',
  description:
    'A collector archive for Game Boy and Game Boy Color: discover every game, track your cartridges, complete your set and keep the memories.',
  disclaimer:
    'Save Slot is a fan-made collector archive and is not affiliated with, endorsed or sponsored by Nintendo. Game Boy and Game Boy Color are trademarks of Nintendo.',
} as const

export type NavItem = {
  href: string
  label: string
  short: string
  /** Only shown in the desktop header from the xl breakpoint (it gets crowded below). */
  xlOnly?: boolean
}

/** Mobile bottom bar: exactly five buttons. */
export const primaryNav: NavItem[] = [
  { href: '/', label: 'Home', short: 'Home' },
  { href: '/games', label: 'Games', short: 'Games' },
  { href: '/shop', label: 'Shop', short: 'Shop' },
  { href: '/repairs', label: 'Repairs', short: 'Repair' },
  { href: '/collection', label: 'Collection', short: 'Mine' },
]

/** Desktop header. Items marked xlOnly appear from the xl breakpoint (it gets crowded below). */
export const desktopNav: NavItem[] = [
  { href: '/', label: 'Home', short: 'Home' },
  { href: '/games', label: 'Games', short: 'Games' },
  { href: '/shop', label: 'Shop', short: 'Shop' },
  { href: '/repairs', label: 'Repairs', short: 'Repairs' },
  { href: '/collection', label: 'Collection', short: 'Mine' },
  { href: '/wishlist', label: 'Wishlist', short: 'Wish' },
  { href: '/contact', label: 'Contact', short: 'Contact', xlOnly: true },
  { href: '/stats', label: 'Stats', short: 'Stats', xlOnly: true },
  { href: '/achievements', label: 'Stickers', short: 'Stickers', xlOnly: true },
]

/** Personal pages, linked from the collection page (handy on mobile). */
export const myNav: NavItem[] = [
  { href: '/collection', label: 'Collection', short: 'Mine' },
  { href: '/wishlist', label: 'Wishlist', short: 'Wish' },
  { href: '/stats', label: 'Stats', short: 'Stats' },
  { href: '/achievements', label: 'Stickers', short: 'Stickers' },
]

export const platformNav: NavItem[] = [
  { href: '/gb', label: 'Game Boy', short: 'GB' },
  { href: '/gbc', label: 'Game Boy Color', short: 'GBC' },
]
