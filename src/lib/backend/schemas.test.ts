import { describe, expect, it } from 'vitest'
import {
  collectionItemSchema,
  memorySchema,
  profileSchema,
  scoreSchema,
  signUpSchema,
} from './schemas'
import { safeNext } from './safe-next'

describe('collectionItemSchema', () => {
  const base = { releaseId: 'seed:tetris:eu', hasCart: 'on' }

  it('parses a full form', () => {
    expect(
      collectionItemSchema.parse({
        ...base,
        hasBox: 'on',
        hasManual: null,
        condition: 'mint',
        price: '€ 12,50',
        purchasedOn: '2024-05-01',
        notes: '  from a flea market  ',
      }),
    ).toEqual({
      releaseId: 'seed:tetris:eu',
      hasCart: true,
      hasBox: true,
      hasManual: false,
      condition: 'mint',
      purchasePriceCents: 1250,
      purchaseCurrency: 'EUR',
      purchasedOn: '2024-05-01',
      notes: 'from a flea market',
    })
  })

  it('treats empty optional fields as null', () => {
    const v = collectionItemSchema.parse({
      ...base,
      condition: '',
      price: '',
      purchasedOn: '',
      notes: '',
    })
    expect(v).toMatchObject({
      condition: null,
      purchasePriceCents: null,
      purchaseCurrency: null,
      purchasedOn: null,
      notes: null,
    })
  })

  it('needs at least one of cart, box or manual', () => {
    const r = collectionItemSchema.safeParse({ releaseId: 'x' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].path).toEqual(['hasCart'])
  })

  it('rejects bad prices, dates and conditions', () => {
    expect(collectionItemSchema.safeParse({ ...base, price: 'free' }).success).toBe(false)
    expect(collectionItemSchema.safeParse({ ...base, price: '-3' }).success).toBe(false)
    expect(collectionItemSchema.safeParse({ ...base, purchasedOn: '01-05-2024' }).success).toBe(
      false,
    )
    expect(collectionItemSchema.safeParse({ ...base, condition: 'shiny' }).success).toBe(false)
  })

  it('rounds prices to cents', () => {
    expect(collectionItemSchema.parse({ ...base, price: '9.999' }).purchasePriceCents).toBe(1000)
  })
})

describe('other schemas', () => {
  it('score is 1–10 or null', () => {
    expect(scoreSchema.parse('8')).toBe(8)
    expect(scoreSchema.parse(null)).toBeNull()
    expect(scoreSchema.safeParse('11').success).toBe(false)
  })

  it('memory year must be plausible', () => {
    expect(memorySchema.parse({ body: 'Hi', yearRemembered: '1998', isPublic: 'on' })).toEqual({
      body: 'Hi',
      yearRemembered: 1998,
      isPublic: true,
    })
    expect(memorySchema.safeParse({ body: 'Hi', yearRemembered: '1850' }).success).toBe(false)
    expect(memorySchema.safeParse({ body: '   ' }).success).toBe(false)
  })

  it('usernames are lowercased and restricted', () => {
    expect(
      profileSchema.parse({ username: 'Player_One', preferredRegion: 'eu', visibility: 'private' })
        .username,
    ).toBe('player_one')
    expect(
      profileSchema.safeParse({
        username: 'no spaces',
        preferredRegion: 'eu',
        visibility: 'private',
      }).success,
    ).toBe(false)
  })

  it('sign-up needs a real e-mail and 8+ char password', () => {
    expect(signUpSchema.safeParse({ email: ' A@B.NL ', password: '12345678' }).data?.email).toBe(
      'a@b.nl',
    )
    expect(signUpSchema.safeParse({ email: 'nope', password: '12345678' }).success).toBe(false)
    expect(signUpSchema.safeParse({ email: 'a@b.nl', password: 'short' }).success).toBe(false)
  })
})

describe('safeNext', () => {
  it.each([
    ['/collection?tab=gb', '/collection?tab=gb'],
    ['//evil.example', '/collection'],
    ['https://evil.example', '/collection'],
    ['/\\evil.example', '/collection'],
    ['/ok\r\nSet-Cookie: x', '/collection'],
    [undefined, '/collection'],
  ])('%s → %s', (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })
})
