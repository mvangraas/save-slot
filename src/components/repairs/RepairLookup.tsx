'use client'

import { lookupRepairAction, type RepairLookupState } from '@/app/actions/repairs'
import { FormMessage, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PixelButton } from '@/components/retro/PixelButton'
import { formatEuro } from '@/lib/format'
import { EstimateText } from './Estimate'
import { RepairTimeline } from './RepairTimeline'

export function RepairLookup() {
  const { state, pending, formProps } = useForm<RepairLookupState>(lookupRepairAction)
  const r = state.repair
  return (
    <div className="space-y-6">
      <form
        {...formProps}
        className="grid gap-4 bg-surface p-5 sm:grid-cols-[1fr_2fr_auto]"
        noValidate
      >
        <TextField
          label="Repair number"
          name="number"
          placeholder="RS-XXXXXX"
          autoComplete="off"
          error={state.errors?.number}
        />
        <TextField
          label="E-mail used for the request"
          name="email"
          type="email"
          autoComplete="email"
          error={state.errors?.email}
        />
        <div className="flex items-end">
          <PixelButton type="submit" disabled={pending}>
            {pending ? 'Looking up…' : 'Show status'}
          </PixelButton>
        </div>
      </form>
      {!state.ok ? <FormMessage ok={false} message={state.message} /> : null}
      {r ? (
        <section aria-labelledby="result-title" className="space-y-4">
          <h2 id="result-title" className="font-display text-sm uppercase">
            {r.number} · {r.deviceName} · {r.issueName}
          </h2>
          <RepairTimeline status={r.status} events={r.events} />
          <p className="text-sm">
            {r.finalPriceCents !== null ? (
              <>
                <strong>Final price:</strong> {formatEuro(r.finalPriceCents)}
              </>
            ) : (
              <EstimateText estimate={r.estimate} />
            )}
          </p>
        </section>
      ) : null}
    </div>
  )
}
