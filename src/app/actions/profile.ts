'use server'

import { refresh } from 'next/cache'
import { requireUser } from '@/lib/backend'
import { fieldErrors, profileSchema, type FormState } from '@/lib/backend/schemas'

export async function updateProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { store } = await requireUser('/settings')
  const parsed = profileSchema.safeParse({
    username: form.get('username'),
    displayName: form.get('displayName'),
    preferredRegion: form.get('preferredRegion'),
    visibility: form.get('visibility'),
  })
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await store.updateProfile(parsed.data)
  if (!res.ok) return { errors: { username: res.error } }
  refresh()
  return { ok: true, message: 'PROGRESS SAVED' }
}
