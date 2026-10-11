'use client'

import { saveCategoryAction } from '@/app/actions/admin'
import { FormMessage, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PixelButton } from '@/components/retro/PixelButton'

export function CategoryForm() {
  const { state, pending, formProps } = useForm(saveCategoryAction)
  return (
    <form {...formProps} className="flex flex-wrap items-end gap-3" noValidate>
      <TextField label="Category name" name="name" error={state.errors?.name} />
      <TextField label="Slug" name="slug" placeholder="e.g. games" error={state.errors?.slug} />
      <PixelButton type="submit" size="sm" variant="secondary" disabled={pending}>
        Add category
      </PixelButton>
      <FormMessage ok={state.ok} message={state.message} />
    </form>
  )
}
