'use server'

import { saveProgress } from '@/lib/achievements/server'
import { requireUser } from '@/lib/backend'
import {
  fieldErrors,
  idSchema,
  memorySchema,
  playStatusSchema,
  scoreSchema,
  type FormState,
} from '@/lib/backend/schemas'

const back = (form: FormData) => String(form.get('returnTo') ?? '/games')

export async function setScoreAction(form: FormData): Promise<void> {
  const { store } = await requireUser(back(form))
  const gameId = idSchema.safeParse(form.get('gameId'))
  const raw = form.get('score')
  const parsed = scoreSchema.safeParse(raw === '' || raw === null ? null : raw)
  if (!gameId.success || !parsed.success) return
  await store.setRating(gameId.data, { score: parsed.data })
  await saveProgress(store)
}

export async function setFavoriteAction(form: FormData): Promise<void> {
  const { store } = await requireUser(back(form))
  const gameId = idSchema.safeParse(form.get('gameId'))
  if (!gameId.success) return
  await store.setRating(gameId.data, { isFavorite: form.get('isFavorite') === 'true' })
  await saveProgress(store)
}

export async function setPlayStatusAction(form: FormData): Promise<void> {
  const { store } = await requireUser(back(form))
  const gameId = idSchema.safeParse(form.get('gameId'))
  const status = playStatusSchema.safeParse(form.get('status') ?? '')
  if (!gameId.success || !status.success) return
  await store.setPlayStatus(gameId.data, status.data)
  await saveProgress(store)
}

export async function toggleWishlistAction(form: FormData): Promise<void> {
  const { store } = await requireUser(back(form))
  const gameId = idSchema.safeParse(form.get('gameId'))
  if (!gameId.success) return
  await store.setWishlisted(gameId.data, form.get('wishlisted') === 'true')
  await saveProgress(store)
}

export async function addMemoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { store } = await requireUser(back(form))
  const gameId = idSchema.safeParse(form.get('gameId'))
  const parsed = memorySchema.safeParse({
    body: form.get('body'),
    yearRemembered: form.get('yearRemembered'),
    isPublic: form.get('isPublic'),
  })
  if (!gameId.success) return { message: 'Unknown game.' }
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await store.addMemory(gameId.data, parsed.data)
  if (!res.ok) return { message: res.error }
  await saveProgress(store)
  return { ok: true, message: 'MEMORY SAVED' }
}

export async function removeMemoryAction(form: FormData): Promise<void> {
  const { store } = await requireUser(back(form))
  const id = idSchema.safeParse(form.get('id'))
  if (!id.success) return
  await store.removeMemory(id.data)
  await saveProgress(store)
}
