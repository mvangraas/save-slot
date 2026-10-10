import 'server-only'
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { seedGames } from '@/data/seed/catalog'
import { ACHIEVEMENTS } from '@/lib/achievements/definitions'
import { evaluateAchievements, type CatalogGame } from '@/lib/achievements/evaluate'
import type { Region } from '@/lib/types'
import {
  fail,
  ok,
  type AuthBackend,
  type Backend,
  type CollectionItem,
  type CollectionItemInput,
  type Memory,
  type PlayEntry,
  type PlayStatus,
  type Profile,
  type SessionUser,
  type UserStore,
  type WishlistEntry,
  type WishlistPatch,
} from './types'

/**
 * In-memory backend for local development and e2e tests, used ONLY when Supabase is not
 * configured and SAVESLOT_MEMORY_BACKEND=1. Data lives in the server process and is lost on
 * restart. It mirrors the Supabase rules (per-user scoping, unique wishlist/rating per game).
 */

export const SESSION_COOKIE = 'ss_dev_session'

type Account = { id: string; email: string; salt: string; hash: Buffer }
type ItemRow = CollectionItemInput & { id: string; userId: string; createdAt: string }
type DB = {
  accounts: Map<string, Account> // by email
  sessions: Map<string, string> // token → userId
  profiles: Map<string, Profile>
  items: ItemRow[]
  ratings: Map<string, { score: number | null; isFavorite: boolean }> // `${user}:${game}`
  plays: Map<string, { status: PlayStatus; updatedAt: string }>
  wishlist: Map<string, WishlistPatch & { createdAt: string }>
  memories: (Memory & { userId: string })[]
  achievements: Map<string, Map<string, string>> // userId → code → unlockedAt
  wishGranted: Set<string> // userIds
}

const g = globalThis as unknown as { __saveslotMemoryDb?: DB }
const db: DB = (g.__saveslotMemoryDb ??= {
  accounts: new Map(),
  sessions: new Map(),
  profiles: new Map(),
  items: [],
  ratings: new Map(),
  plays: new Map(),
  wishlist: new Map(),
  memories: [],
  achievements: new Map(),
  wishGranted: new Set(),
})
db.achievements ??= new Map()
db.wishGranted ??= new Set()

// ---- catalogue lookups (seed ids: game `seed:<slug>`, release `seed:<slug>:<region>`)
const gamesById = new Map(seedGames.map((game) => [`seed:${game.slug}`, game]))
function release(releaseId: string) {
  const [, slug, region] = releaseId.split(':')
  const game = seedGames.find((x) => x.slug === slug)
  const r = game?.releases.find((x) => x.region === region)
  if (!game || !r) return null
  return { game, release: r, region: region as Region }
}
const gameInfo = (gameId: string) => {
  const game = gamesById.get(gameId)
  if (!game) return null
  return {
    gameId,
    gameSlug: game.slug,
    gameTitle: game.title,
    platform: game.compat === 'gb' ? ('gb' as const) : ('gbc' as const),
    compat: game.compat,
    firstReleaseYear: Math.min(...game.releases.map((r) => r.year)),
  }
}

const seedCatalogFacts: CatalogGame[] = seedGames.map((game) => ({
  id: `seed:${game.slug}`,
  platform: game.compat === 'gb' ? 'gb' : 'gbc',
  compat: game.compat,
  firstReleaseYear: Math.min(...game.releases.map((r) => r.year)),
  genres: game.genres,
  series: game.series ?? null,
  sgbEnhanced: game.features?.sgbEnhanced === true,
  rumble: game.features?.rumble === true,
  releases: game.releases.map((r) => ({ region: r.region, year: r.year })),
}))

function hydrate(row: ItemRow): CollectionItem | null {
  const rel = release(row.releaseId)
  if (!rel) return null
  const info = gameInfo(`seed:${rel.game.slug}`)!
  const { userId: _u, ...rest } = row
  void _u
  return { ...rest, ...info, region: rel.region, localTitle: rel.release.localTitle ?? null }
}

const hashPassword = (password: string, salt: string) =>
  createHash('sha256').update(`${salt}:${password}`).digest()

async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const userId = token ? db.sessions.get(token) : undefined
  if (!userId) return null
  const account = [...db.accounts.values()].find((a) => a.id === userId)
  return account ? { id: account.id, email: account.email } : null
}

async function startSession(userId: string) {
  const token = randomBytes(24).toString('hex')
  db.sessions.set(token, userId)
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production' && process.env.E2E !== '1',
  })
}

const auth: AuthBackend = {
  supportsMagicLink: false,
  getUser: currentUser,

  async signUp(email, password) {
    const key = email.toLowerCase()
    if (db.accounts.has(key)) return fail('An account with this e-mail already exists.')
    const id = randomUUID()
    const salt = randomBytes(8).toString('hex')
    db.accounts.set(key, { id, email: key, salt, hash: hashPassword(password, salt) })
    db.profiles.set(id, {
      id,
      username: `player_${id.replaceAll('-', '').slice(0, 12)}`,
      displayName: null,
      preferredRegion: 'eu',
      visibility: 'private',
    })
    await startSession(id)
    return ok({ needsConfirmation: false })
  },

  async signIn(email, password) {
    const account = db.accounts.get(email.toLowerCase())
    if (!account || !timingSafeEqual(account.hash, hashPassword(password, account.salt))) {
      return fail('Wrong e-mail or password.')
    }
    await startSession(account.id)
    return ok(undefined)
  },

  async sendMagicLink() {
    return fail('Magic links need Supabase. Use a password in local development.')
  },

  async signOut() {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (token) db.sessions.delete(token)
    store.delete(SESSION_COOKIE)
  },
}

function storeFor(user: SessionUser): UserStore {
  const key = (gameId: string) => `${user.id}:${gameId}`
  const mine = () => db.items.filter((i) => i.userId === user.id)

  return {
    async getProfile() {
      return db.profiles.get(user.id)!
    },
    async updateProfile(patch) {
      const current = db.profiles.get(user.id)!
      if (
        patch.username &&
        [...db.profiles.values()].some((p) => p.id !== user.id && p.username === patch.username)
      ) {
        return fail('That username is taken.')
      }
      db.profiles.set(user.id, { ...current, ...patch })
      return ok(undefined)
    },
    async listCollection() {
      return mine()
        .map(hydrate)
        .filter((x): x is CollectionItem => !!x)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async addItem(input) {
      if (!release(input.releaseId)) return fail('Unknown release.')
      const id = randomUUID()
      db.items.push({ ...input, id, userId: user.id, createdAt: new Date().toISOString() })
      return ok({ id })
    },
    async updateItem(id, input) {
      const row = db.items.find((i) => i.id === id && i.userId === user.id)
      if (!row) return fail('Item not found.')
      if (!release(input.releaseId)) return fail('Unknown release.')
      Object.assign(row, input)
      return ok(undefined)
    },
    async removeItem(id) {
      const before = db.items.length
      db.items = db.items.filter((i) => !(i.id === id && i.userId === user.id))
      return before === db.items.length ? fail('Item not found.') : ok(undefined)
    },
    async gameState(gameId) {
      const rating = db.ratings.get(key(gameId))
      return {
        items: (await this.listCollection()).filter((i) => i.gameId === gameId),
        score: rating?.score ?? null,
        isFavorite: rating?.isFavorite ?? false,
        playStatus: db.plays.get(key(gameId))?.status ?? null,
        wishlisted: db.wishlist.has(key(gameId)),
        memories: db.memories
          .filter((m) => m.userId === user.id && m.gameId === gameId)
          .map(({ userId: _u, ...m }) => (void _u, m))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }
    },
    async setRating(gameId, patch) {
      if (!gameInfo(gameId)) return fail('Unknown game.')
      const current = db.ratings.get(key(gameId)) ?? { score: null, isFavorite: false }
      const next = { ...current, ...patch }
      if (next.score === null && !next.isFavorite) db.ratings.delete(key(gameId))
      else db.ratings.set(key(gameId), next)
      return ok(undefined)
    },
    async setPlayStatus(gameId, status) {
      if (!gameInfo(gameId)) return fail('Unknown game.')
      if (status) db.plays.set(key(gameId), { status, updatedAt: new Date().toISOString() })
      else db.plays.delete(key(gameId))
      return ok(undefined)
    },
    async setWishlisted(gameId, wishlisted) {
      if (!gameInfo(gameId)) return fail('Unknown game.')
      if (wishlisted) {
        if (!db.wishlist.has(key(gameId))) {
          db.wishlist.set(key(gameId), {
            priority: 'medium',
            preferredRegion: null,
            desiredCondition: null,
            maxPriceCents: null,
            notes: null,
            createdAt: new Date().toISOString(),
          })
        }
      } else if (db.wishlist.delete(key(gameId))) {
        // Mirrors the Supabase trigger: removing a wish you now own means it was granted.
        const owns = mine().some((i) => i.releaseId.startsWith(`seed:${gameId.slice(5)}:`))
        if (owns) db.wishGranted.add(user.id)
      }
      return ok(undefined)
    },
    async addMemory(gameId, input) {
      if (!gameInfo(gameId)) return fail('Unknown game.')
      db.memories.push({
        ...input,
        id: randomUUID(),
        gameId,
        userId: user.id,
        createdAt: new Date().toISOString(),
      })
      return ok(undefined)
    },
    async removeMemory(id) {
      const before = db.memories.length
      db.memories = db.memories.filter((m) => !(m.id === id && m.userId === user.id))
      return before === db.memories.length ? fail('Memory not found.') : ok(undefined)
    },
    async listPlayLogs() {
      const out: PlayEntry[] = []
      for (const [k, v] of db.plays) {
        const [uid, gameId] = [k.slice(0, k.indexOf(':')), k.slice(k.indexOf(':') + 1)]
        if (uid !== user.id) continue
        const info = gameInfo(gameId)
        if (info) out.push({ ...info, status: v.status, updatedAt: v.updatedAt })
      }
      return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    async wishlistCount() {
      return [...db.wishlist.keys()].filter((k) => k.startsWith(`${user.id}:`)).length
    },
    async listWishlist() {
      const out: WishlistEntry[] = []
      for (const [k, v] of db.wishlist) {
        if (!k.startsWith(`${user.id}:`)) continue
        const info = gameInfo(k.slice(user.id.length + 1))
        if (info) out.push({ ...info, ...v })
      }
      return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async listAchievements() {
      const mineA = db.achievements.get(user.id) ?? new Map<string, string>()
      return [...mineA.entries()]
        .map(([code, unlockedAt]) => ({ code, unlockedAt }))
        .sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt) || a.code.localeCompare(b.code))
    },
    async evaluateAchievements() {
      const prefix = `${user.id}:`
      const ratings = [...db.ratings.entries()].filter(([k]) => k.startsWith(prefix))
      const earned = evaluateAchievements({
        copies: mine().flatMap((i) => {
          const rel = release(i.releaseId)
          return rel ? [{ ...i, gameId: `seed:${rel.game.slug}`, region: rel.region }] : []
        }),
        catalog: seedCatalogFacts,
        playStatuses: [...db.plays.entries()]
          .filter(([k]) => k.startsWith(prefix))
          .map(([, v]) => v.status),
        memoryCount: db.memories.filter((m) => m.userId === user.id).length,
        ratedCount: ratings.filter(([, r]) => r.score !== null).length,
        favoriteCount: ratings.filter(([, r]) => r.isFavorite).length,
        wishlistCount: [...db.wishlist.keys()].filter((k) => k.startsWith(prefix)).length,
        wishGranted: db.wishGranted.has(user.id),
      })
      const mineA = db.achievements.get(user.id) ?? new Map<string, string>()
      db.achievements.set(user.id, mineA)
      const now = new Date().toISOString()
      const fresh = ACHIEVEMENTS.map((a) => a.code).filter(
        (code) => earned.has(code) && !mineA.has(code),
      )
      for (const code of fresh) mineA.set(code, now)
      return fresh
    },
    async updateWishlistItem(gameId, patch) {
      const current = db.wishlist.get(key(gameId))
      if (!current) return fail('Not on your wishlist.')
      db.wishlist.set(key(gameId), { ...current, ...patch })
      return ok(undefined)
    },
  }
}

export const memoryBackend: Backend = {
  mode: 'memory',
  auth,
  store: async (user) => storeFor(user),
}

/** Test helper: wipe everything. */
export function resetMemoryBackend() {
  db.accounts.clear()
  db.sessions.clear()
  db.profiles.clear()
  db.items = []
  db.ratings.clear()
  db.plays.clear()
  db.wishlist.clear()
  db.memories = []
  db.achievements.clear()
  db.wishGranted.clear()
}
