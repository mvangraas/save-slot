import { describe, expect, it } from 'vitest'
import { cleanUrl } from './FilterForm'

const fd = (entries: [string, string][]) => {
  const d = new FormData()
  entries.forEach(([k, v]) => d.append(k, v))
  return d
}

describe('cleanUrl', () => {
  it('drops empty fields and defaults', () => {
    expect(
      cleanUrl(
        '/games',
        fd([
          ['q', ''],
          ['sort', 'title'],
          ['view', 'grid'],
          ['platform', ''],
          ['region', 'jp'],
        ]),
      ),
    ).toBe('/games?region=jp')
  })

  it('keeps meaningful values', () => {
    expect(
      cleanUrl(
        '/gb',
        fd([
          ['q', 'kirby'],
          ['sort', 'year_asc'],
          ['view', 'list'],
        ]),
      ),
    ).toBe('/gb?q=kirby&sort=year_asc&view=list')
  })

  it('switches a new search to best-match order', () => {
    expect(
      cleanUrl(
        '/games',
        fd([
          ['q', 'kirby'],
          ['sort', 'title'],
        ]),
        false,
      ),
    ).toBe('/games?q=kirby')
    expect(
      cleanUrl(
        '/games',
        fd([
          ['q', 'kirby'],
          ['sort', 'title'],
        ]),
        true,
      ),
    ).toBe('/games?q=kirby&sort=title')
  })
})
