'use server'

import { redirect } from 'next/navigation'
import { getBackend, safeNext } from '@/lib/backend'
import { requestOrigin } from '@/lib/backend/origin'
import {
  fieldErrors,
  magicLinkSchema,
  signInSchema,
  signUpSchema,
  type FormState,
} from '@/lib/backend/schemas'

const callbackUrl = async (next: string) =>
  `${await requestOrigin()}/auth/callback?next=${encodeURIComponent(next)}`

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  })
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await getBackend().auth.signIn(parsed.data.email, parsed.data.password)
  if (!res.ok) return { message: res.error }
  redirect(safeNext(form.get('next')))
}

export async function signUpAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    email: form.get('email'),
    password: form.get('password'),
  })
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const next = safeNext(form.get('next'))
  const res = await getBackend().auth.signUp(
    parsed.data.email,
    parsed.data.password,
    await callbackUrl(next),
  )
  if (!res.ok) return { message: res.error }
  if (res.data.needsConfirmation) {
    return {
      ok: true,
      message: 'Almost there! Check your inbox and click the link to confirm your account.',
    }
  }
  redirect(next)
}

export async function magicLinkAction(_prev: FormState, form: FormData): Promise<FormState> {
  const parsed = magicLinkSchema.safeParse({ email: form.get('email') })
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await getBackend().auth.sendMagicLink(
    parsed.data.email,
    await callbackUrl(safeNext(form.get('next'))),
  )
  if (!res.ok) return { message: res.error }
  // Same answer whether or not the address already has an account, so accounts can't be probed.
  return { ok: true, message: 'Check your inbox — we sent you a sign-in link.' }
}

export async function signOutAction(): Promise<void> {
  await getBackend().auth.signOut()
  redirect('/')
}
