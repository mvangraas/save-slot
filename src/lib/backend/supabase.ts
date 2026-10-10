import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  fail,
  ok,
  type AuthBackend,
  type Backend,
  type CollectionItem,
  type PlayStatus,
  type SessionUser,
  type UserStore,
} from './types'

type DB = SupabaseClient<Database>

async function client(): Promise<DB> {
  const c = await createSupabaseServerClient()
  if (!c) throw new Error('Supabase is not configured')
  return c
}

/** Map Supabase auth errors to short, friendly copy (never leak internals). */
function authError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Wrong e-mail or password.'
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'An account with this e-mail already exists.'
  if (m.includes('email not confirmed'))
    return 'Please confirm your e-mail first — check your inbox.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many attempts. Try again in a minute.'
  if (m.includes('password')) return 'That password is too weak. Use at least 8 characters.'
  return 'Something went wrong. Please try again.'
}

const auth: AuthBackend = {
  supportsMagicLink: true,

  async getUser() {
    const db = await createSupabaseServerClient()
    if (!db) return null
    const { data } = await db.auth.getClaims()
    const claims = data?.claims
    if (!claims?.sub) return null
    return { id: claims.sub, email: (claims.email as string | undefined) ?? '' }
  },

  async signUp(email, password, redirectTo) {
    const db = await client()
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) return fail(authError(error.message))
    return ok({ needsConfirmation: !data.session })
  },

  async signIn(email, password) {
    const db = await client()
    const { error } = await db.auth.signInWithPassword({ email, password })
    return error ? fail(authError(error.message)) : ok(undefined)
  },

  async sendMagicLink(email, redirectTo) {
    const db = await client()
    const { error } = await db.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    })
    return error ? fail(authError(error.message)) : ok(undefined)
  },

  async signOut() {
    const db = await client()
    await db.auth.signOut()
  },
}

const itemSelect = `id, release_id, has_cart, has_box, has_manual, condition, purchase_price_cents,
  purchase_currency, purchased_on, notes, created_at,
  release:releases!inner ( region, local_title,
    game:games!inner ( id, slug, title, platform, compat, first_release_year ) )` as const

type ItemRow = {
  id: string
  release_id: string
  has_cart: boolean
  has_box: boolean
  has_manual: boolean
  condition: CollectionItem['condition']
  purchase_price_cents: number | null
  purchase_currency: string | null
  purchased_on: string | null
  notes: string | null
  created_at: string
  release: {
    region: CollectionItem['region']
    local_title: string | null
    game: {
      id: string
      slug: string
      title: string
      platform: CollectionItem['platform']
      compat: CollectionItem['compat']
      first_release_year: number | null
    }
  }
}

function toItem(r: ItemRow): CollectionItem {
  return {
    id: r.id,
    releaseId: r.release_id,
    hasCart: r.has_cart,
    hasBox: r.has_box,
    hasManual: r.has_manual,
    condition: r.condition,
    purchasePriceCents: r.purchase_price_cents,
    purchaseCurrency: r.purchase_currency,
    purchasedOn: r.purchased_on,
    notes: r.notes,
    createdAt: r.created_at,
    region: r.release.region,
    localTitle: r.release.local_title,
    gameId: r.release.game.id,
    gameSlug: r.release.game.slug,
    gameTitle: r.release.game.title,
    platform: r.release.game.platform,
    compat: r.release.game.compat,
    firstReleaseYear: r.release.game.first_release_year,
  }
}

const toRow = (i: Parameters<UserStore['addItem']>[0]) => ({
  release_id: i.releaseId,
  has_cart: i.hasCart,
  has_box: i.hasBox,
  has_manual: i.hasManual,
  condition: i.condition,
  purchase_price_cents: i.purchasePriceCents,
  purchase_currency: i.purchasePriceCents == null ? null : (i.purchaseCurrency ?? 'EUR'),
  purchased_on: i.purchasedOn,
  notes: i.notes,
})

const dbError = (e: { code?: string; message: string }) => {
  console.error('[supabase]', e.code, e.message)
  if (e.code === '23505') return 'That is already taken.'
  if (e.code === '42501') return 'You are not allowed to do that.'
  return 'Could not save. Please try again.'
}

function storeFor(db: DB, user: SessionUser): UserStore {
  const uid = user.id
  return {
    async getProfile() {
      const { data, error } = await db
        .from('profiles')
        .select('id, username, display_name, preferred_region, visibility')
        .eq('id', uid)
        .single()
      if (error) throw new Error(`profile: ${error.message}`)
      return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        preferredRegion: data.preferred_region,
        visibility: data.visibility,
      }
    },
    async updateProfile(p) {
      const { error } = await db
        .from('profiles')
        .update({
          ...(p.username !== undefined && { username: p.username }),
          ...(p.displayName !== undefined && { display_name: p.displayName }),
          ...(p.preferredRegion !== undefined && { preferred_region: p.preferredRegion }),
          ...(p.visibility !== undefined && { visibility: p.visibility }),
        })
        .eq('id', uid)
      if (error?.code === '23505') return fail('That username is taken.')
      return error ? fail(dbError(error)) : ok(undefined)
    },
    async listCollection() {
      const { data, error } = await db
        .from('collection_items')
        .select(itemSelect)
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (error) throw new Error(`collection: ${error.message}`)
      return (data as unknown as ItemRow[]).map(toItem)
    },
    async addItem(input) {
      const { data, error } = await db
        .from('collection_items')
        .insert({ ...toRow(input), user_id: uid })
        .select('id')
        .single()
      return error ? fail(dbError(error)) : ok({ id: data.id })
    },
    async updateItem(id, input) {
      const { error, count } = await db
        .from('collection_items')
        .update(toRow(input), { count: 'exact' })
        .eq('id', id)
        .eq('user_id', uid)
      if (error) return fail(dbError(error))
      return count === 0 ? fail('Item not found.') : ok(undefined)
    },
    async removeItem(id) {
      const { error, count } = await db
        .from('collection_items')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', uid)
      if (error) return fail(dbError(error))
      return count === 0 ? fail('Item not found.') : ok(undefined)
    },
    async gameState(gameId) {
      const [items, rating, play, wish, memories] = await Promise.all([
        db
          .from('collection_items')
          .select(itemSelect)
          .eq('user_id', uid)
          .eq('release.game_id', gameId)
          .order('created_at', { ascending: false }),
        db
          .from('ratings')
          .select('score, is_favorite')
          .eq('user_id', uid)
          .eq('game_id', gameId)
          .maybeSingle(),
        db
          .from('play_logs')
          .select('status')
          .eq('user_id', uid)
          .eq('game_id', gameId)
          .maybeSingle(),
        db
          .from('wishlist_items')
          .select('id')
          .eq('user_id', uid)
          .eq('game_id', gameId)
          .maybeSingle(),
        db
          .from('memories')
          .select('id, game_id, body, year_remembered, is_public, created_at')
          .eq('user_id', uid)
          .eq('game_id', gameId)
          .order('created_at', { ascending: false }),
      ])
      for (const r of [items, rating, play, wish, memories]) {
        if (r.error) throw new Error(`gameState: ${r.error.message}`)
      }
      return {
        items: ((items.data ?? []) as unknown as ItemRow[]).map(toItem),
        score: rating.data?.score ?? null,
        isFavorite: rating.data?.is_favorite ?? false,
        playStatus: (play.data?.status as PlayStatus | undefined) ?? null,
        wishlisted: !!wish.data,
        memories: (memories.data ?? []).map((m) => ({
          id: m.id,
          gameId: m.game_id,
          body: m.body,
          yearRemembered: m.year_remembered,
          isPublic: m.is_public,
          createdAt: m.created_at,
        })),
      }
    },
    async setRating(gameId, patch) {
      const { data: current, error: readError } = await db
        .from('ratings')
        .select('score, is_favorite')
        .eq('user_id', uid)
        .eq('game_id', gameId)
        .maybeSingle()
      if (readError) return fail(dbError(readError))
      const score = patch.score !== undefined ? patch.score : (current?.score ?? null)
      const isFavorite = patch.isFavorite ?? current?.is_favorite ?? false
      const { error } =
        score === null && !isFavorite
          ? await db.from('ratings').delete().eq('user_id', uid).eq('game_id', gameId)
          : await db
              .from('ratings')
              .upsert({ user_id: uid, game_id: gameId, score, is_favorite: isFavorite })
      return error ? fail(dbError(error)) : ok(undefined)
    },
    async setPlayStatus(gameId, status) {
      const { error } = status
        ? await db
            .from('play_logs')
            .upsert({ user_id: uid, game_id: gameId, status }, { onConflict: 'user_id,game_id' })
        : await db.from('play_logs').delete().eq('user_id', uid).eq('game_id', gameId)
      return error ? fail(dbError(error)) : ok(undefined)
    },
    async setWishlisted(gameId, wishlisted) {
      const { error } = wishlisted
        ? await db
            .from('wishlist_items')
            .upsert(
              { user_id: uid, game_id: gameId },
              { onConflict: 'user_id,game_id', ignoreDuplicates: true },
            )
        : await db.from('wishlist_items').delete().eq('user_id', uid).eq('game_id', gameId)
      return error ? fail(dbError(error)) : ok(undefined)
    },
    async addMemory(gameId, input) {
      const { error } = await db.from('memories').insert({
        user_id: uid,
        game_id: gameId,
        body: input.body,
        year_remembered: input.yearRemembered,
        is_public: input.isPublic,
      })
      return error ? fail(dbError(error)) : ok(undefined)
    },
    async removeMemory(id) {
      const { error } = await db.from('memories').delete().eq('id', id).eq('user_id', uid)
      return error ? fail(dbError(error)) : ok(undefined)
    },
    async listPlayLogs() {
      const { data, error } = await db
        .from('play_logs')
        .select(
          'status, updated_at, game:games!inner ( id, slug, title, platform, compat, first_release_year )',
        )
        .eq('user_id', uid)
        .order('updated_at', { ascending: false })
      if (error) throw new Error(`play_logs: ${error.message}`)
      return data.map((r) => ({
        gameId: r.game.id,
        gameSlug: r.game.slug,
        gameTitle: r.game.title,
        platform: r.game.platform,
        compat: r.game.compat,
        firstReleaseYear: r.game.first_release_year,
        status: r.status,
        updatedAt: r.updated_at,
      }))
    },
    async listWishlist() {
      const { data, error } = await db
        .from('wishlist_items')
        .select(
          `priority, preferred_region, desired_condition, max_price_cents, notes, created_at,
           game:games!inner ( id, slug, title, platform, compat, first_release_year )`,
        )
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (error) throw new Error(`wishlist: ${error.message}`)
      return data.map((w) => ({
        gameId: w.game.id,
        gameSlug: w.game.slug,
        gameTitle: w.game.title,
        platform: w.game.platform,
        compat: w.game.compat,
        firstReleaseYear: w.game.first_release_year,
        priority: w.priority,
        preferredRegion: w.preferred_region,
        desiredCondition: w.desired_condition,
        maxPriceCents: w.max_price_cents,
        notes: w.notes,
        createdAt: w.created_at,
      }))
    },
    async updateWishlistItem(gameId, p) {
      const { error, count } = await db
        .from('wishlist_items')
        .update(
          {
            priority: p.priority,
            preferred_region: p.preferredRegion,
            desired_condition: p.desiredCondition,
            max_price_cents: p.maxPriceCents,
            notes: p.notes,
          },
          { count: 'exact' },
        )
        .eq('user_id', uid)
        .eq('game_id', gameId)
      if (error) return fail(dbError(error))
      return count === 0 ? fail('Not on your wishlist.') : ok(undefined)
    },
    async wishlistCount() {
      const { count, error } = await db
        .from('wishlist_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
      if (error) throw new Error(`wishlist: ${error.message}`)
      return count ?? 0
    },
    async listAchievements() {
      const { data, error } = await db
        .from('user_achievements')
        .select('achievement_code, unlocked_at')
        .eq('user_id', uid)
        .order('unlocked_at', { ascending: false })
      if (error) throw new Error(`achievements: ${error.message}`)
      return data.map((r) => ({ code: r.achievement_code, unlockedAt: r.unlocked_at }))
    },
    async evaluateAchievements() {
      const { data, error } = await db.rpc('fn_evaluate_achievements')
      if (error) throw new Error(`achievements: ${error.message}`)
      return data ?? []
    },
  }
}

export const supabaseBackend: Backend = {
  mode: 'supabase',
  auth,
  store: async (user) => storeFor(await client(), user),
}
