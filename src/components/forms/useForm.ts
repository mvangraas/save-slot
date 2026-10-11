'use client'

import { startTransition, useActionState, type FormEvent } from 'react'
import type { FormState } from '@/lib/backend/schemas'

/**
 * useActionState without React's automatic form reset, so a typo in one field
 * doesn't wipe everything else the user typed. Still works without JS via `action`.
 */
export function useForm<S extends FormState = FormState>(
  action: (s: Awaited<S>, f: FormData) => Promise<S>,
  opts: { prepare?: (form: HTMLFormElement) => Promise<FormData> } = {},
) {
  const [state, formAction, pending] = useActionState<S, FormData>(action, {} as Awaited<S>)
  return {
    state,
    pending,
    formProps: {
      action: formAction,
      onSubmit: (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        if (opts.prepare) {
          // e.g. shrink photos in the browser before they are uploaded
          void opts.prepare(form).then((data) => startTransition(() => formAction(data)))
        } else {
          const data = new FormData(form)
          startTransition(() => formAction(data))
        }
      },
    },
  }
}
