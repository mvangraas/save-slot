'use client'

import {
  addRepairNoteAction,
  setRepairFinalPriceAction,
  setRepairStatusAction,
} from '@/app/actions/admin'
import { Field, FormMessage, inputCls, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PixelButton } from '@/components/retro/PixelButton'
import { REPAIR_STATUSES, repairStatusLabel, type RepairStatus } from '@/lib/shop/types'

export function RepairStatusForm({ id, status }: { id: string; status: RepairStatus }) {
  const { state, pending, formProps } = useForm(setRepairStatusAction)
  return (
    <form {...formProps} className="space-y-3" noValidate>
      <input type="hidden" name="id" value={id} />
      <Field label="New status">
        {(a11y) => (
          <select {...a11y} name="status" defaultValue={status} className={inputCls}>
            {REPAIR_STATUSES.map((s) => (
              <option key={s} value={s}>
                {repairStatusLabel[s]}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Message for the customer (optional)" hint="Shown on their status page.">
        {(a11y) => (
          <textarea
            {...a11y}
            name="note"
            rows={3}
            maxLength={1000}
            className={`${inputCls} py-2`}
          />
        )}
      </Field>
      <PixelButton type="submit" size="sm" disabled={pending}>
        Update status
      </PixelButton>
      <FormMessage ok={state.ok} message={state.message} />
    </form>
  )
}

export function FinalPriceForm({ id, cents }: { id: string; cents: number | null }) {
  const { state, pending, formProps } = useForm(setRepairFinalPriceAction)
  return (
    <form {...formProps} className="flex flex-wrap items-end gap-3" noValidate>
      <input type="hidden" name="id" value={id} />
      <TextField
        label="Final price (€)"
        name="finalPrice"
        inputMode="decimal"
        defaultValue={cents === null ? '' : (cents / 100).toFixed(2)}
        hint="Leave empty while unknown. Only set it once agreed with the customer."
        error={state.errors?.finalPrice}
      />
      <PixelButton type="submit" size="sm" variant="secondary" disabled={pending}>
        Save price
      </PixelButton>
      <FormMessage ok={state.ok} message={state.message} />
    </form>
  )
}

export function NoteForm({ id }: { id: string }) {
  const { state, pending, formProps } = useForm(addRepairNoteAction)
  return (
    <form {...formProps} className="space-y-2" noValidate>
      <input type="hidden" name="id" value={id} />
      <Field label="Internal note (never shown to the customer)" error={state.errors?.body}>
        {(a11y) => (
          <textarea
            {...a11y}
            name="body"
            rows={3}
            maxLength={3000}
            className={`${inputCls} py-2`}
          />
        )}
      </Field>
      <PixelButton type="submit" size="sm" variant="secondary" disabled={pending}>
        Add note
      </PixelButton>
      <FormMessage ok={state.ok} message={state.message} />
    </form>
  )
}
