'use server'

import { refresh } from 'next/cache'
import { requireUser } from '@/lib/backend'
import { collectionItemSchema, fieldErrors, idSchema, type FormState } from '@/lib/backend/schemas'

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
  const parsed = collectionItemSchema.safeParse(itemFields(form))
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await store.addItem(parsed.data)
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'PROGRESS SAVED' }
}

export async function updateCollectionItemAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const { store } = await requireUser(String(form.get('returnTo') ?? '/collection'))
  const id = idSchema.safeParse(form.get('id'))
  const parsed = collectionItemSchema.safeParse(itemFields(form))
  if (!id.success) return { message: 'Item not found.' }
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await store.updateItem(id.data, parsed.data)
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'PROGRESS SAVED' }
}

export async function removeCollectionItemAction(form: FormData): Promise<void> {
  const { store } = await requireUser('/collection')
  const id = idSchema.safeParse(form.get('id'))
  if (!id.success) return
  await store.removeItem(id.data)
  refresh()
}
