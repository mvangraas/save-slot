'use server'

import { refresh } from 'next/cache'
import { requireUser } from '@/lib/backend'
import { idSchema, RATE_LIMITED, type FormState } from '@/lib/backend/schemas'
import { processPhoto } from '@/lib/photos/process'

export async function uploadPhotoAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { store } = await requireUser(String(form.get('returnTo') ?? '/collection'))
  if (!(await store.allowWrite())) return RATE_LIMITED
  const itemId = idSchema.safeParse(form.get('itemId'))
  const file = form.get('photo')
  if (!itemId.success) return { message: 'Unknown copy.' }
  if (!(file instanceof File)) return { errors: { photo: 'Choose a photo first.' } }
  const processed = await processPhoto(file)
  if (!processed.ok) return { errors: { photo: processed.error } }
  const res = await store.addPhoto(itemId.data, processed.photo)
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'PHOTO SAVED' }
}

export async function removePhotoAction(form: FormData): Promise<void> {
  const { store } = await requireUser(String(form.get('returnTo') ?? '/collection'))
  if (!(await store.allowWrite())) return
  const itemId = idSchema.safeParse(form.get('itemId'))
  const path = String(form.get('path') ?? '')
  if (!itemId.success || !path) return
  await store.removePhoto(itemId.data, path)
  refresh()
}
