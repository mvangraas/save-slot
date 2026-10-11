'use server'

import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/backend'
import type { FormState } from '@/lib/backend/schemas'

const DELETE_CONFIRMATION = 'DELETE'

export async function deleteAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { store } = await requireUser('/settings')
  if (String(form.get('confirm') ?? '').trim() !== DELETE_CONFIRMATION) {
    return { errors: { confirm: `Type ${DELETE_CONFIRMATION} to confirm.` } }
  }
  const res = await store.deleteAccount()
  if (!res.ok) return { message: res.error }
  redirect('/account-deleted')
}
