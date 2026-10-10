import type { UnlockedAchievement } from '@/lib/achievements/definitions'
import type { CartCompat, Platform, Region } from '@/lib/types'

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string }
export const ok = <T>(data: T): Result<T> => ({ ok: true, data })
export const fail = (error: string): Result<never> => ({ ok: false, error })

export type SessionUser = { id: string; email: string }

export const ITEM_CONDITIONS = ['loose', 'good', 'very_good', 'mint', 'sealed'] as const
export type ItemCondition = (typeof ITEM_CONDITIONS)[number]
export const conditionLabel: Record<ItemCondition, string> = {
  loose: 'Loose',
  good: 'Good',
  very_good: 'Very good',
  mint: 'Mint',
  sealed: 'Sealed',
}

export const PLAY_STATUSES = ['backlog', 'playing', 'completed', 'abandoned'] as const
export type PlayStatus = (typeof PLAY_STATUSES)[number]
export const playStatusLabel: Record<PlayStatus, string> = {
  backlog: 'Backlog',
  playing: 'Playing',
  completed: 'Completed',
  abandoned: 'Abandoned',
}

export const WISH_PRIORITIES = ['high', 'medium', 'low'] as const
export type WishPriority = (typeof WISH_PRIORITIES)[number]
export const priorityLabel: Record<WishPriority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export type WishlistPatch = {
  priority: WishPriority
  preferredRegion: Region | null
  desiredCondition: ItemCondition | null
  maxPriceCents: number | null
  notes: string | null
}

export type WishlistEntry = WishlistPatch & {
  gameId: string
  gameSlug: string
  gameTitle: string
  platform: Platform
  compat: CartCompat
  firstReleaseYear: number | null
  createdAt: string
}

export type Visibility = 'private' | 'unlisted' | 'public'

export type Profile = {
  id: string
  username: string
  displayName: string | null
  preferredRegion: Region
  visibility: Visibility
}

export type ProfilePatch = Partial<
  Pick<Profile, 'username' | 'displayName' | 'preferredRegion' | 'visibility'>
>

export type CollectionItemInput = {
  releaseId: string
  hasCart: boolean
  hasBox: boolean
  hasManual: boolean
  condition: ItemCondition | null
  purchasePriceCents: number | null
  purchaseCurrency: string | null
  purchasedOn: string | null
  notes: string | null
}

export type CollectionItem = CollectionItemInput & {
  id: string
  region: Region
  localTitle: string | null
  gameId: string
  gameSlug: string
  gameTitle: string
  platform: Platform
  compat: CartCompat
  firstReleaseYear: number | null
  createdAt: string
}

export type Memory = {
  id: string
  gameId: string
  body: string
  yearRemembered: number | null
  isPublic: boolean
  createdAt: string
}

export type MemoryInput = Pick<Memory, 'body' | 'yearRemembered' | 'isPublic'>

export type GameUserState = {
  items: CollectionItem[]
  score: number | null
  isFavorite: boolean
  playStatus: PlayStatus | null
  wishlisted: boolean
  memories: Memory[]
}

export type PlayEntry = {
  gameId: string
  gameSlug: string
  gameTitle: string
  platform: Platform
  compat: CartCompat
  firstReleaseYear: number | null
  status: PlayStatus
  updatedAt: string
}

/** Everything is scoped to one signed-in user (RLS does the same in Supabase). */
export interface UserStore {
  getProfile(): Promise<Profile>
  updateProfile(patch: ProfilePatch): Promise<Result>
  listCollection(): Promise<CollectionItem[]>
  addItem(input: CollectionItemInput): Promise<Result<{ id: string }>>
  updateItem(id: string, input: CollectionItemInput): Promise<Result>
  removeItem(id: string): Promise<Result>
  gameState(gameId: string): Promise<GameUserState>
  /** Partial update: only the fields you pass change. */
  setRating(gameId: string, patch: { score?: number | null; isFavorite?: boolean }): Promise<Result>
  setPlayStatus(gameId: string, status: PlayStatus | null): Promise<Result>
  setWishlisted(gameId: string, wishlisted: boolean): Promise<Result>
  listWishlist(): Promise<WishlistEntry[]>
  updateWishlistItem(gameId: string, patch: WishlistPatch): Promise<Result>
  addMemory(gameId: string, input: MemoryInput): Promise<Result>
  removeMemory(id: string): Promise<Result>
  listPlayLogs(): Promise<PlayEntry[]>
  wishlistCount(): Promise<number>
  /** Unlocked achievements, newest first. */
  listAchievements(): Promise<UnlockedAchievement[]>
  /** Server-side evaluation: stores new unlocks and returns their codes. */
  evaluateAchievements(): Promise<string[]>
}

export type SignUpResult = { needsConfirmation: boolean }

export interface AuthBackend {
  getUser(): Promise<SessionUser | null>
  signUp(email: string, password: string, redirectTo: string): Promise<Result<SignUpResult>>
  signIn(email: string, password: string): Promise<Result>
  sendMagicLink(email: string, redirectTo: string): Promise<Result>
  signOut(): Promise<void>
  supportsMagicLink: boolean
}

export interface Backend {
  mode: 'supabase' | 'memory' | 'none'
  auth: AuthBackend
  store(user: SessionUser): Promise<UserStore>
}
