import { describe, expect, it } from 'vitest'
import { parseUnlockCookie } from './server'

describe('parseUnlockCookie', () => {
  it('keeps only known codes, de-duplicated', () => {
    expect(parseUnlockCookie('first_cart.nope.first_cart.jp_import')).toEqual([
      'first_cart',
      'jp_import',
    ])
  })
  it('handles empty values', () => {
    expect(parseUnlockCookie(undefined)).toEqual([])
    expect(parseUnlockCookie('')).toEqual([])
  })
})
