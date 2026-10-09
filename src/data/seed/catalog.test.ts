import { describe, expect, it } from 'vitest'
import { seedCompanies, seedGames, seedGenres, seedSeries } from './catalog'

const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/

describe('seed catalogue integrity', () => {
  it('has unique, valid slugs', () => {
    const slugs = seedGames.map((g) => g.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    slugs.forEach((s) => expect(s).toMatch(slugRe))
  })

  it('only references known companies, genres and series', () => {
    const companies = new Set(seedCompanies.map((c) => c.slug))
    const genres = new Set<string>(seedGenres.map((g) => g.slug))
    const series = new Set<string>(seedSeries.map((s) => s.slug))
    for (const g of seedGames) {
      expect(companies, g.slug).toContain(g.developer)
      expect(companies, g.slug).toContain(g.publisher)
      g.genres.forEach((x) => expect(genres, g.slug).toContain(x))
      if (g.series) expect(series, g.slug).toContain(g.series)
      g.releases.forEach((r) => r.publisher && expect(companies).toContain(r.publisher))
    }
  })

  it('has at most one release per region and plausible years', () => {
    for (const g of seedGames) {
      const regions = g.releases.map((r) => r.region)
      expect(new Set(regions).size, g.slug).toBe(regions.length)
      expect(g.releases.length, g.slug).toBeGreaterThan(0)
      g.releases.forEach((r) => {
        expect(r.year).toBeGreaterThanOrEqual(1989)
        expect(r.year).toBeLessThanOrEqual(2003)
      })
    }
  })

  it('only marks Game Boy Color-era carts as GBC', () => {
    for (const g of seedGames.filter((x) => x.compat !== 'gb')) {
      expect(Math.min(...g.releases.map((r) => r.year)), g.slug).toBeGreaterThanOrEqual(1998)
    }
  })

  it('has no prices, product codes or images (seed rules)', () => {
    expect(JSON.stringify(seedGames)).not.toMatch(/price|productCode|https?:/i)
  })
})
