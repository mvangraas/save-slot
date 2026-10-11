'use server'

import { RATE_LIMITED } from '@/lib/backend/schemas'
import { saveProgress } from '@/lib/achievements/server'
import { requireUser } from '@/lib/backend'
import {
  bulkSchema,
  collectionItemSchema,
  fieldErrors,
  idSchema,
  type FormState,
} from '@/lib/backend/schemas'

function itemFields(form: FormData) {
  return {
    releaseId: form.get('releaseId'),
    hasCart: form.get('hasCart'),
    hasBox: form.get('hasBox'),
    hasManual: form.get('hasManual'),
    condition: form.get('condition'),
    price: form.get('price'),
    purchasedOn: form.get('purchasedOn'),
    notes: form.get('notes'),
  }
}

export async function addCollectionItemAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { store } = await requireUser(String(form.get('returnTo') ?? '/collection'))
  if (!(await store.allowWrite())) return RATE_LIMITED
  const parsed = collectionItemSchema.safeParse(itemFields(form))
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await store.addItem(parsed.data)
  if (!res.ok) return { message: res.error }
  await saveProgress(store)
  return { ok: true, message: 'PROGRESS SAVED' }
}

export async function updateCollectionItemAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { store } = await requireUser(String(form.get('returnTo') ?? '/collection'))
  if (!(await store.allowWrite())) return RATE_LIMITED
  const id = idSchema.safeParse(form.get('id'))
  const parsed = collectionItemSchema.safeParse(itemFields(form))
  if (!id.success) return { message: 'Item not found.' }
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await store.updateItem(id.data, parsed.data)
  if (!res.ok) return { message: res.error }
  await saveProgress(store)
  return { ok: true, message: 'PROGRESS SAVED' }
}

export async function removeCollectionItemAction(form: FormData): Promise<void> {
  const { store } = await requireUser('/collection')
  if (!(await store.allowWrite())) return
  const id = idSchema.safeParse(form.get('id'))
  if (!id.success) return
  await store.removeItem(id.data)
  await saveProgress(store)
}

/** Bulk actions on selected copies in the collection table. */
export async function bulkCollectionAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { store } = await requireUser('/collection?view=table')
  if (!(await store.allowWrite())) return RATE_LIMITED
  const parsed = bulkSchema.safeParse({ op: form.get('op'), ids: form.getAll('ids') })
  if (!parsed.success) return { message: fieldErrors(parsed.error).ids ?? 'Choose an action.' }
  const { op, ids } = parsed.data

  const mine = await store.listCollection()
  const selected = mine.filter((i) => ids.includes(i.id))
  if (selected.length === 0) return { message: 'Nothing selected.' }
  const games = [...new Set(selected.map((i) => i.gameId))]

  if (op === 'remove' || op === 'to-wishlist') {
    for (const i of selected) await store.removeItem(i.id)
    if (op === 'to-wishlist') for (const g of games) await store.setWishlisted(g, true)
  } else {
    for (const g of games) await store.setPlayStatus(g, op)
  }
  await saveProgress(store)
  const n = selected.length
  const what =
    op === 'remove'
      ? 'removed'
      : op === 'to-wishlist'
        ? 'moved to your wishlist'
        : `marked as ${op}`
  return { ok: true, message: `${n} ${n === 1 ? 'copy' : 'copies'} ${what}.` }
}
