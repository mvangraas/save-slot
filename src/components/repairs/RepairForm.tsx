'use client'

import Link from 'next/link'
import { useState } from 'react'
import { submitRepairAction } from '@/app/actions/repairs'
import { Field, FormMessage, inputCls, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PixelButton } from '@/components/retro/PixelButton'
import { formDataWithShrunkImages } from '@/lib/photos/shrink'
import {
  DELIVERY_METHODS,
  deliveryLabel,
  type DeliveryMethod,
  type RepairCatalog,
} from '@/lib/shop/types'
import { estimateFor } from '@/lib/shop/estimate'
import { EstimateText } from './Estimate'

const deliveryHint: Record<DeliveryMethod, string> = {
  appointment: 'Pick a preferred date; we confirm the appointment by e-mail or phone.',
  mail_in: 'You receive the shipping address after we have reviewed your request.',
  drop_off: 'Pick a preferred date; we confirm when you can drop it off.',
}

export function RepairForm({ catalog, minDate }: { catalog: RepairCatalog; minDate: string }) {
  const { state, pending, formProps } = useForm(submitRepairAction, {
    prepare: (form) => formDataWithShrunkImages(form, 'photos'),
  })
  const [deviceId, setDeviceId] = useState('')
  const [issueId, setIssueId] = useState('')
  const [delivery, setDelivery] = useState<DeliveryMethod | ''>('')
  const e = state.errors ?? {}
  const estimate = deviceId && issueId ? estimateFor(catalog, deviceId, issueId) : null

  return (
    <form {...formProps} className="space-y-6" noValidate>
      <fieldset className="space-y-3 bg-surface p-5">
        <legend className="font-display text-sm uppercase">1 · Your device</legend>
        <div
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          role="radiogroup"
          aria-label="Device"
        >
          {catalog.devices.map((d) => (
            <label
              key={d.id}
              className="flex min-h-11 cursor-pointer items-center gap-3 border-2 border-line p-3 has-[:checked]:border-lcd-200 has-[:checked]:bg-surface-2"
            >
              <input
                type="radio"
                name="deviceId"
                value={d.id}
                checked={deviceId === d.id}
                onChange={() => setDeviceId(d.id)}
                className="size-5"
              />
              <span>{d.name}</span>
            </label>
          ))}
        </div>
        {e.deviceId ? <ErrorText>{e.deviceId}</ErrorText> : null}
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Brand (optional)"
            name="brand"
            placeholder="e.g. Nintendo"
            error={e.brand}
          />
          <TextField
            label="Model (optional)"
            name="model"
            placeholder="e.g. DMG-01"
            error={e.model}
          />
          <TextField label="Serial number (optional)" name="serial" error={e.serial} />
        </div>
      </fieldset>

      <fieldset className="space-y-3 bg-surface p-5">
        <legend className="font-display text-sm uppercase">2 · The problem</legend>
        <Field label="What is wrong?" error={e.issueId}>
          {(a11y) => (
            <select
              {...a11y}
              name="issueId"
              value={issueId}
              onChange={(ev) => setIssueId(ev.target.value)}
              className={inputCls}
            >
              <option value="">Choose a problem…</option>
              {catalog.issues.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        {issueId ? (
          <p className="text-sm text-fg-muted">
            {catalog.issues.find((i) => i.id === issueId)?.description}
          </p>
        ) : null}
        <div aria-live="polite" className="border-l-4 border-sticker bg-surface-2 p-3 text-sm">
          {deviceId && issueId ? (
            <>
              <EstimateText estimate={estimate} />
              <p className="mt-1 text-xs text-fg-muted">
                This is an indication, not a quote. You get the final price after we have checked
                your device, and we only repair after you agree to it.
              </p>
            </>
          ) : (
            <span>Choose your device and the problem to see a price indication.</span>
          )}
        </div>
        <Field label="Describe the problem" error={e.description}>
          {(a11y) => (
            <textarea
              {...a11y}
              name="description"
              rows={5}
              maxLength={3000}
              placeholder="What happens, since when, anything you already tried…"
              className={`${inputCls} py-2`}
            />
          )}
        </Field>
        <Field
          label="Photos of the defect (optional, max 4)"
          hint="JPEG, PNG or WebP. Location data is removed. Only the workshop can see them."
          error={e.photos}
        >
          {(a11y) => (
            <input
              {...a11y}
              type="file"
              name="photos"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="text-sm file:mr-2 file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:font-display file:text-xs file:uppercase"
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="space-y-3 bg-surface p-5">
        <legend className="font-display text-sm uppercase">3 · How do you get it to us?</legend>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Delivery">
          {DELIVERY_METHODS.map((m) => (
            <label
              key={m}
              className="flex min-h-11 cursor-pointer items-center gap-3 border-2 border-line p-3 has-[:checked]:border-lcd-200 has-[:checked]:bg-surface-2"
            >
              <input
                type="radio"
                name="delivery"
                value={m}
                checked={delivery === m}
                onChange={() => setDelivery(m)}
                className="size-5"
              />
              <span>{deliveryLabel[m]}</span>
            </label>
          ))}
        </div>
        {e.delivery ? <ErrorText>{e.delivery}</ErrorText> : null}
        {delivery ? <p className="text-sm text-fg-muted">{deliveryHint[delivery]}</p> : null}
        {delivery === 'appointment' || delivery === 'drop_off' ? (
          <TextField
            label="Preferred date (optional)"
            name="preferredDate"
            type="date"
            min={minDate}
            error={e.preferredDate}
          />
        ) : null}
      </fieldset>

      <fieldset className="grid gap-4 bg-surface p-5 sm:grid-cols-3">
        <legend className="font-display text-sm uppercase">4 · Your contact details</legend>
        <TextField label="Name" name="name" autoComplete="name" error={e.name} />
        <TextField label="E-mail" name="email" type="email" autoComplete="email" error={e.email} />
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" error={e.phone} />
      </fieldset>

      <div className="space-y-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 size-5"
            aria-invalid={e.consent ? true : undefined}
          />
          <span>
            I agree that my details and photos are used to handle this repair, as described in the{' '}
            <Link href="/legal/privacy" target="_blank" className="underline">
              privacy statement
            </Link>
            .
          </span>
        </label>
        {e.consent ? <ErrorText>{e.consent}</ErrorText> : null}
        <PixelButton type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Request a repair'}
        </PixelButton>
        <p className="text-xs text-fg-muted">
          Sending a request is free and doesn’t commit you to anything. You never pay before you
          have agreed to the final price.
        </p>
        <FormMessage ok={state.ok} message={state.message} />
      </div>
    </form>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-sm font-medium text-[#ff8a85]">
      {children}
    </p>
  )
}
