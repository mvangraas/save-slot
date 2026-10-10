'use server'

import { refresh } from 'next/cache'
import { requireUser } from '@/lib/backend'
import {
  collectionItemSchema,
  fieldErrors,
  idSchema,
  wishlistSchema,
  type FormState,
} from '@/lib/backend/schemas'

export async function updateWishlistAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { store } = await requireUser('/wishlist')
  const gameId = idSchema.safeParse(form.get('gameId'))
  const parsed = wishlistSchema.safeParse({
    priority: form.get('priority'),
    preferredRegion: form.get('preferredRegion'),
    desiredCondition: form.get('desiredCondition'),
    maxPrice: form.get('maxPrice'),
    notes: form.get('notes'),
  })
  if (!gameId.success) return { message: 'Unknown game.' }
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const { maxPrice, ...rest } = parsed.data
  const res = await store.updateWishlistItem(gameId.data, { ...rest, maxPriceCents: maxPrice })
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'PROGRESS SAVED' }
}

export async function removeFromWishlistAction(form: FormData): Promise<void> {
  const { store } = await requireUser('/wishlist')
  const gameId = idSchema.safeParse(form.get('gameId'))
  if (!gameId.success) return
  await store.setWishlisted(gameId.data, false)
  refresh()
}

/** "GOT IT!": add the copy to the collection, then take the game off the wishlist. */
export async function gotItAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { store } = await requireUser('/wishlist')
  const gameId = idSchema.safeParse(form.get('gameId'))
  const parsed = collectionItemSchema.safeParse({
    releaseId: form.get('releaseId'),
    hasCart: form.get('hasCart'),
    hasBox: form.get('hasBox'),
    hasManual: form.get('hasManual'),
    condition: form.get('condition'),
    price: form.get('price'),
    purchasedOn: form.get('purchasedOn'),
    notes: form.get('notes'),
  })
  if (!gameId.success) return { message: 'Unknown game.' }
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const added = await store.addItem(parsed.data)
  if (!added.ok) return { message: added.error }
  await store.setWishlisted(gameId.data, false)
  refresh()
  return { ok: true, message: 'WISH GRANTED' }
}
