import type { CartridgeCardProps } from '@/components/retro/CartridgeCard'

/**
 * source: 'seed' — a hand-picked preview shelf until the catalogue lands in Phase 2.
 * Year = first release year (any region). No prices, product codes or images.
 */
export const previewShelf: (Pick<CartridgeCardProps, 'title' | 'compat' | 'year'> & {
  source: 'seed'
})[] = [
  { title: 'Tetris', compat: 'gb', year: 1989, source: 'seed' },
  { title: 'Super Mario Land', compat: 'gb', year: 1989, source: 'seed' },
  { title: "Kirby's Dream Land", compat: 'gb', year: 1992, source: 'seed' },
  {
    title: "The Legend of Zelda: Link's Awakening DX",
    compat: 'gbc_dual',
    year: 1998,
    source: 'seed',
  },
  { title: 'Wario Land 3', compat: 'gbc_only', year: 2000, source: 'seed' },
]
