'use client'

import { useEffect, useRef } from 'react'
import {
  Check,
  Field,
  FormMessage,
  inputCls,
  SubmitButton,
  TextField,
} from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import type { FormState } from '@/lib/backend/schemas'
import { conditionLabel, ITEM_CONDITIONS, type CollectionItem } from '@/lib/backend/types'

export type ReleaseOption = { id: string; label: string }

type Props = {
  releases: ReleaseOption[]
  action: (s: FormState, f: FormData) => Promise<FormState>
  item?: CollectionItem
  returnTo: string
  submitLabel: string
  onDone?: () => void
  /** Extra hidden fields, e.g. the gameId for "GOT IT!". */
  hidden?: Record<string, string>
  /** Prefill for a new copy. */
  defaults?: { releaseId?: string; condition?: string | null; price?: string }
}

/** Add or edit one physical copy: which release, cart/box/manual, condition, price, date, notes. */
export function ItemForm({
  releases,
  action,
  item,
  returnTo,
  submitLabel,
  onDone,
  hidden,
  defaults,
}: Props) {
  const { state, pending, formProps } = useForm(action)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!state.ok) return
    if (!item) formRef.current?.reset()
    onDone?.()
  }, [state, item, onDone])

  const price =
    item?.purchasePriceCents != null
      ? (item.purchasePriceCents / 100).toFixed(2)
      : (defaults?.price ?? '')

  return (
    <form ref={formRef} {...formProps} className="space-y-4" noValidate>
      <input type="hidden" name="returnTo" value={returnTo} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <Field label="Release" error={state.errors?.releaseId}>
        {(a11y) => (
          <select
            {...a11y}
            name="releaseId"
            defaultValue={item?.releaseId ?? defaults?.releaseId ?? releases[0]?.id}
            className={inputCls}
          >
            {releases.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        )}
      </Field>

      <fieldset>
        <legend className="mb-1 font-display text-xs tracking-wide text-fg-muted uppercase">
          What do you have?
        </legend>
        <div className="flex flex-wrap gap-x-5">
          <Check name="hasCart" label="Cartridge" defaultChecked={item?.hasCart ?? true} />
          <Check name="hasBox" label="Box" defaultChecked={item?.hasBox ?? false} />
          <Check name="hasManual" label="Manual" defaultChecked={item?.hasManual ?? false} />
        </div>
        {state.errors?.hasCart ? (
          <p role="alert" className="text-sm font-medium text-[#ff8a85]">
            {state.errors.hasCart}
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Condition" error={state.errors?.condition}>
          {(a11y) => (
            <select
              {...a11y}
              name="condition"
              defaultValue={item?.condition ?? defaults?.condition ?? ''}
              className={inputCls}
            >
              <option value="">Not set</option>
              {ITEM_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {conditionLabel[c]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <TextField
          label="Paid (€)"
          name="price"
          inputMode="decimal"
          placeholder="12.50"
          defaultValue={price}
          error={state.errors?.price}
        />
        <TextField
          label="Bought on"
          name="purchasedOn"
          type="date"
          defaultValue={item?.purchasedOn ?? ''}
          error={state.errors?.purchasedOn}
        />
      </div>

      <Field label="Notes" error={state.errors?.notes}>
        {(a11y) => (
          <textarea
            {...a11y}
            name="notes"
            rows={2}
            maxLength={2000}
            defaultValue={item?.notes ?? ''}
            className={inputCls + ' py-2'}
          />
        )}
      </Field>

      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
    </form>
  )
}
