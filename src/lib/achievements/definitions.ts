import type { Platform } from '@/lib/types'

/**
 * Achievement catalogue. Codes, names and descriptions must stay in sync with the rows in
 * `supabase/migrations/*_achievements.sql` (a unit test checks this) and the evaluator rules in
 * both `evaluate.ts` (memory backend) and `public.fn_evaluate_achievements()` (Supabase).
 */
export const ICON_KEYS = [
  'cart',
  'shelf',
  'trophy',
  'box',
  'seal',
  'leaf',
  'prism',
  'globe',
  'plane',
  'clock',
  'flag',
  'joystick',
  'book',
  'heart',
  'star',
  'gift',
  'coin',
  'sgb',
  'wave',
  'stack',
] as const
export type IconKey = (typeof ICON_KEYS)[number]

export type AchievementDef = {
  code: string
  name: string
  description: string
  icon: IconKey
  platform: Platform | null
}

export const ACHIEVEMENTS = [
  // Collection size
  {
    code: 'first_cart',
    name: 'Insert Cartridge',
    description: 'Add your first game to the collection.',
    icon: 'cart',
    platform: null,
  },
  {
    code: 'ten_carts',
    name: 'Shelf Starter',
    description: 'Own 10 different games.',
    icon: 'shelf',
    platform: null,
  },
  {
    code: 'twentyfive_carts',
    name: 'Full Shelf',
    description: 'Own 25 different games.',
    icon: 'stack',
    platform: null,
  },
  {
    code: 'fifty_carts',
    name: 'Collector',
    description: 'Own 50 different games.',
    icon: 'trophy',
    platform: null,
  },
  // Condition
  {
    code: 'cib_first',
    name: 'Complete In Box',
    description: 'Own a copy with cartridge, box and manual.',
    icon: 'box',
    platform: null,
  },
  {
    code: 'cib_10',
    name: 'Boxed Set',
    description: 'Own 10 complete-in-box copies.',
    icon: 'box',
    platform: null,
  },
  {
    code: 'sealed_first',
    name: 'Factory Fresh',
    description: 'Own a sealed copy.',
    icon: 'seal',
    platform: null,
  },
  {
    code: 'price_10',
    name: 'Bookkeeper',
    description: 'Log the purchase price of 10 copies.',
    icon: 'coin',
    platform: null,
  },
  // Platforms
  {
    code: 'gb_10',
    name: 'Shades of Green',
    description: 'Own 10 Game Boy games.',
    icon: 'leaf',
    platform: 'gb',
  },
  {
    code: 'gbc_10',
    name: 'Full Color',
    description: 'Own 10 Game Boy Color games.',
    icon: 'prism',
    platform: 'gbc',
  },
  {
    code: 'gbc_only_first',
    name: 'Color Exclusive',
    description: 'Own a Game Boy Color-only cartridge.',
    icon: 'prism',
    platform: 'gbc',
  },
  {
    code: 'dual_mode_5',
    name: 'Black Cartridge',
    description: 'Own 5 dual-mode cartridges.',
    icon: 'stack',
    platform: 'gbc',
  },
  {
    code: 'launch_year',
    name: 'Day One',
    description: 'Own a game first released in 1989.',
    icon: 'clock',
    platform: 'gb',
  },
  // Regions
  {
    code: 'jp_import',
    name: 'Import Hunter',
    description: 'Own a Japanese release.',
    icon: 'plane',
    platform: null,
  },
  {
    code: 'us_import',
    name: 'Across the Pond',
    description: 'Own a North American release.',
    icon: 'plane',
    platform: null,
  },
  {
    code: 'three_regions',
    name: 'World Tour',
    description: 'Own releases from Europe, North America and Japan.',
    icon: 'globe',
    platform: null,
  },
  {
    code: 'regional_variant',
    name: 'Regional Variant',
    description: 'Own the same game from two different regions.',
    icon: 'flag',
    platform: null,
  },
  {
    code: 'year_complete',
    name: 'Time Capsule',
    description: 'Own every game released in one region in one year.',
    icon: 'clock',
    platform: null,
  },
  // Catalogue breadth
  {
    code: 'genres_5',
    name: 'Genre Hopper',
    description: 'Own games from 5 different genres.',
    icon: 'stack',
    platform: null,
  },
  {
    code: 'series_3',
    name: 'Saga Seeker',
    description: 'Own 3 games from the same series.',
    icon: 'book',
    platform: null,
  },
  {
    code: 'sgb_5',
    name: 'Super Sized',
    description: 'Own 5 Super Game Boy-enhanced games.',
    icon: 'sgb',
    platform: 'gb',
  },
  {
    code: 'rumble_first',
    name: 'Good Vibrations',
    description: 'Own a rumble cartridge.',
    icon: 'wave',
    platform: 'gbc',
  },
  // Playing
  {
    code: 'completed_first',
    name: 'The End',
    description: 'Mark a game as completed.',
    icon: 'flag',
    platform: null,
  },
  {
    code: 'completed_10',
    name: 'Credits Rolled',
    description: 'Mark 10 games as completed.',
    icon: 'trophy',
    platform: null,
  },
  {
    code: 'playing_3',
    name: 'Multitasker',
    description: 'Have 3 games on "playing" at once.',
    icon: 'joystick',
    platform: null,
  },
  // Personal
  {
    code: 'memory_first',
    name: 'Dear Diary',
    description: 'Write your first memory.',
    icon: 'book',
    platform: null,
  },
  {
    code: 'memory_5',
    name: 'Scrapbook',
    description: 'Write 5 memories.',
    icon: 'book',
    platform: null,
  },
  { code: 'rated_10', name: 'Critic', description: 'Rate 10 games.', icon: 'star', platform: null },
  {
    code: 'favorite_first',
    name: 'Heart Container',
    description: 'Mark a game as a favourite.',
    icon: 'heart',
    platform: null,
  },
  // Wishlist
  {
    code: 'wishlist_first',
    name: 'Window Shopper',
    description: 'Put a game on your wishlist.',
    icon: 'heart',
    platform: null,
  },
  {
    code: 'wishlist_granted',
    name: 'Wish Granted',
    description: 'Move a wishlist game into your collection.',
    icon: 'gift',
    platform: null,
  },
] as const satisfies readonly AchievementDef[]

export type AchievementCode = (typeof ACHIEVEMENTS)[number]['code']

const byCode = new Map<string, AchievementDef>(ACHIEVEMENTS.map((a) => [a.code, a]))
export const achievementByCode = (code: string): AchievementDef | undefined => byCode.get(code)

export type UnlockedAchievement = { code: string; unlockedAt: string }
