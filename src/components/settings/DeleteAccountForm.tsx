'use client'

import { deleteAccountAction } from '@/app/actions/account'
import { FormMessage, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PixelButton } from '@/components/retro/PixelButton'

export function DeleteAccountForm() {
  const { state, pending, formProps } = useForm(deleteAccountAction)
  return (
    <form {...formProps} className="space-y-3" noValidate>
      <TextField
        label="Type DELETE to confirm"
        name="confirm"
        autoComplete="off"
        spellCheck={false}
        error={state.errors?.confirm}
      />
      <PixelButton
        type="submit"
        variant="secondary"
        disabled={pending}
        className="bg-sticker-red text-white"
      >
        {pending ? 'Deleting…' : 'Delete my account forever'}
      </PixelButton>
      <FormMessage ok={state.ok} message={state.message} />
    </form>
  )
}
