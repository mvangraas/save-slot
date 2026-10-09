'use client'

import { useEffect, useRef } from 'react'
import { addMemoryAction } from '@/app/actions/game'
import {
  Check,
  Field,
  FormMessage,
  inputCls,
  SubmitButton,
  TextField,
} from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'

export function MemoryForm({ gameId, returnTo }: { gameId: string; returnTo: string }) {
  const { state, pending, formProps } = useForm(addMemoryAction)
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.ok) ref.current?.reset()
  }, [state])
  return (
    <form ref={ref} {...formProps} className="space-y-3" noValidate>
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Field label="Your memory" error={state.errors?.body}>
        {(a11y) => (
          <textarea
            {...a11y}
            name="body"
            rows={3}
            maxLength={2000}
            placeholder="Christmas 1998, the Game Boy Color under the tree…"
            className={inputCls + ' py-2'}
          />
        )}
      </Field>
      <div className="flex flex-wrap items-end gap-4">
        <TextField
          label="Year"
          name="yearRemembered"
          inputMode="numeric"
          placeholder="1998"
          className="w-28"
          error={state.errors?.yearRemembered}
        />
        <Check name="isPublic" label="Show on my public profile" />
      </div>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pending={pending}>
        Save memory
      </SubmitButton>
    </form>
  )
}
