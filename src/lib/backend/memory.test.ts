import { beforeEach, describe, expect, it } from 'vitest'
import { memoryBackend, resetMemoryBackend } from './memory'

const alice = { id: 'alice', email: 'a@x.test' }
const bob = { id: 'bob', email: 'b@x.test' }
const input = {
  releaseId: 'seed:tetris:eu',
  hasCart: true,
  hasBox: false,
  hasManual: false,
  condition: null,
  purchasePriceCents: null,
  purchaseCurrency: null,
  purchasedOn: null,
  notes: null,
}

describe('memory backend store (mirrors RLS rules)', () => {
  beforeEach(() => resetMemoryBackend())

  it('adds, updates and removes your own copies', async () => {
    const a = await memoryBackend.store(alice)
    const added = await a.addItem(input)
    expect(added.ok).toBe(true)
    const [item] = await a.listCollection()
    expect(item).toMatchObject({ gameSlug: 'tetris', region: 'eu', platform: 'gb' })
    expect((await a.updateItem(item.id, { ...input, hasBox: true })).ok).toBe(true)
    expect((await a.listCollection())[0].hasBox).toBe(true)
    expect((await a.removeItem(item.id)).ok).toBe(true)
    expect(await a.listCollection()).toEqual([])
  })

  it('never lets one user touch another user’s data', async () => {
    const a = await memoryBackend.store(alice)
    const b = await memoryBackend.store(bob)
    await a.addItem(input)
    const [item] = await a.listCollection()
    expect(await b.listCollection()).toEqual([])
    expect((await b.updateItem(item.id, input)).ok).toBe(false)
    expect((await b.removeItem(item.id)).ok).toBe(false)
    expect(await a.listCollection()).toHaveLength(1)
  })

  it('rejects unknown releases and games', async () => {
    const a = await memoryBackend.store(alice)
    expect((await a.addItem({ ...input, releaseId: 'seed:nope:eu' })).ok).toBe(false)
    expect((await a.setPlayStatus('seed:nope', 'playing')).ok).toBe(false)
  })

  it('keeps score and favorite independent', async () => {
    const a = await memoryBackend.store(alice)
    await a.setRating('seed:tetris', { score: 8 })
    await a.setRating('seed:tetris', { isFavorite: true })
    expect(await a.gameState('seed:tetris')).toMatchObject({ score: 8, isFavorite: true })
    await a.setRating('seed:tetris', { score: null })
    expect(await a.gameState('seed:tetris')).toMatchObject({ score: null, isFavorite: true })
  })

  it('tracks play status, wishlist and memories per game', async () => {
    const a = await memoryBackend.store(alice)
    await a.setPlayStatus('seed:golf', 'playing')
    await a.setWishlisted('seed:golf', true)
    await a.setWishlisted('seed:golf', true) // idempotent
    await a.addMemory('seed:golf', {
      body: 'Sunday afternoons',
      yearRemembered: 1990,
      isPublic: false,
    })
    const s = await a.gameState('seed:golf')
    expect(s).toMatchObject({ playStatus: 'playing', wishlisted: true })
    expect(s.memories[0].body).toBe('Sunday afternoons')
    expect(await a.wishlistCount()).toBe(1)
    expect((await a.listPlayLogs())[0]).toMatchObject({ gameSlug: 'golf', status: 'playing' })
    await a.setPlayStatus('seed:golf', null)
    expect(await a.listPlayLogs()).toEqual([])
  })

  it('enforces unique usernames', async () => {
    const a = await memoryBackend.store(alice)
    const b = await memoryBackend.store(bob)
    // profiles are created at sign-up; simulate them
    const g = globalThis as unknown as { __saveslotMemoryDb: { profiles: Map<string, unknown> } }
    for (const u of [alice, bob])
      g.__saveslotMemoryDb.profiles.set(u.id, {
        id: u.id,
        username: u.id,
        displayName: null,
        preferredRegion: 'eu',
        visibility: 'private',
      })
    expect((await a.updateProfile({ username: 'bob' })).ok).toBe(false)
    expect((await b.updateProfile({ username: 'bobby' })).ok).toBe(true)
  })
})
