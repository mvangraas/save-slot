'use client'

import { setRepairPriceAction } from '@/app/actions/admin'
import { useForm } from '@/components/forms/useForm'
import { inputCls } from '@/components/forms/fieldStyles'
import type { RepairPrice } from '@/lib/shop/types'

const euro = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2))

/** One cell of the price matrix: price range + duration for a device/problem pair. */
export function RepairPriceForm({
  deviceId,
  issueId,
  label,
  price,
}: {
  deviceId: string
  issueId: string
  label: string
  price: RepairPrice | undefined
}) {
  const { state, pending, formProps } = useForm(setRepairPriceAction)
  const e = state.errors ?? {}
  const err =
    e.priceFrom ?? e.priceTo ?? e.daysMin ?? e.daysMax ?? (!state.ok ? state.message : undefined)
  return (
    <form
      {...formProps}
      aria-label={`Indication for ${label}`}
      className="grid grid-cols-2 gap-1"
      noValidate
    >
      <input type="hidden" name="deviceId" value={deviceId} />
      <input type="hidden" name="issueId" value={issueId} />
      <input
        name="priceFrom"
        aria-label={`${label}: price from (€)`}
        placeholder="€ from"
        inputMode="decimal"
        defaultValue={euro(price?.priceFromCents ?? null)}
        className={`${inputCls} min-h-9 px-2 text-sm`}
      />
      <input
        name="priceTo"
        aria-label={`${label}: price to (€)`}
        placeholder="€ to"
        inputMode="decimal"
        defaultValue={euro(price?.priceToCents ?? null)}
        className={`${inputCls} min-h-9 px-2 text-sm`}
      />
      <input
        name="daysMin"
        aria-label={`${label}: days min`}
        placeholder="days min"
        inputMode="numeric"
        defaultValue={price?.daysMin ?? ''}
        className={`${inputCls} min-h-9 px-2 text-sm`}
      />
      <input
        name="daysMax"
        aria-label={`${label}: days max`}
        placeholder="days max"
        inputMode="numeric"
        defaultValue={price?.daysMax ?? ''}
        className={`${inputCls} min-h-9 px-2 text-sm`}
      />
      <button
        type="submit"
        disabled={pending}
        className="col-span-2 min-h-9 bg-surface-2 font-display text-xs uppercase"
      >
        {pending ? 'Saving…' : state.ok ? 'Saved ✓' : 'Save'}
      </button>
      {err ? (
        <p role="alert" className="col-span-2 text-xs text-[#ff8a85]">
          {err}
        </p>
      ) : null}
    </form>
  )
}
