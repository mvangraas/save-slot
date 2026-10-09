'use client'

import { startTransition, useActionState, type FormEvent } from 'react'
import type { FormState } from '@/lib/backend/schemas'

/**
 * useActionState without React's automatic form reset, so a typo in one field
 * doesn't wipe everything else the user typed. Still works without JS via `action`.
 */
export function useForm(action: (s: FormState, f: FormData) => Promise<FormState>) {
  const [state, formAction, pending] = useActionState(action, {})
  return {
    state,
    pending,
    formProps: {
      action: formAction,
      onSubmit: (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const data = new FormData(e.currentTarget)
        startTransition(() => formAction(data))
      },
    },
  }
}
