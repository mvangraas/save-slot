import { describe, expect, it } from 'vitest'
import { demoPrices } from './prices'

describe('demo prices', () => {
  it('are deterministic, ordered loose < CIB < new and rounded to 50 cents', () => {
    const a = demoPrices('tetris', 'eu')
    expect(demoPrices('tetris', 'eu')).toEqual(a)
    expect(a.loose).toBeLessThan(a.cib)
    expect(a.cib).toBeLessThan(a.new)
    for (const v of Object.values(a)) expect(v % 50).toBe(0)
  })
})
