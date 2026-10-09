'use client'

import { updateProfileAction } from '@/app/actions/profile'
import { Field, FormMessage, inputCls, SubmitButton, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import type { Profile } from '@/lib/backend/types'

export function ProfileForm({ profile }: { profile: Profile }) {
  const { state, pending, formProps } = useForm(updateProfileAction)
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <TextField
        label="Username"
        name="username"
        defaultValue={profile.username}
        autoComplete="username"
        hint="3–24 characters: a–z, 0–9 and _. Used for your public profile link."
        error={state.errors?.username}
      />
      <TextField
        label="Display name"
        name="displayName"
        defaultValue={profile.displayName ?? ''}
        maxLength={40}
        error={state.errors?.displayName}
      />
      <Field
        label="Preferred region"
        hint="Decides which regional title and release you see first."
      >
        {(a11y) => (
          <select
            {...a11y}
            name="preferredRegion"
            defaultValue={profile.preferredRegion}
            className={inputCls}
          >
            <option value="eu">Europe</option>
            <option value="us">North America</option>
            <option value="jp">Japan</option>
          </select>
        )}
      </Field>
      <Field label="Who can see your collection?" error={state.errors?.visibility}>
        {(a11y) => (
          <select
            {...a11y}
            name="visibility"
            defaultValue={profile.visibility}
            className={inputCls}
          >
            <option value="private">Only me</option>
            <option value="unlisted">Anyone with the link</option>
            <option value="public">Public</option>
          </select>
        )}
      </Field>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pending={pending}>Save</SubmitButton>
    </form>
  )
}
