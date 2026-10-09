import { describe, expect, it } from 'vitest'
import { formatReleaseDate, normalize, slugify } from './text'

describe('normalize', () => {
  it('lowercases and strips accents like the database does', () => {
    expect(normalize('Pokémon CRYSTAL')).toBe('pokemon crystal')
  })
})

describe('slugify', () => {
  it('builds URL slugs', () => {
    expect(slugify("Kirby's Dream Land 2")).toBe('kirbys-dream-land-2')
    expect(slugify('Pokémon Trading Card Game')).toBe('pokemon-trading-card-game')
  })
})

describe('formatReleaseDate', () => {
  it('respects the stored precision', () => {
    expect(formatReleaseDate('1998-01-01', 'year')).toBe('1998')
    expect(formatReleaseDate('1998-05-01', 'month')).toBe('May 1998')
    expect(formatReleaseDate('1998-05-12', 'day')).toBe('12 May 1998')
    expect(formatReleaseDate(null, null)).toBe('Unknown')
  })
})
