'use client'

import Link from 'next/link'
import { useState } from 'react'
import { gotItAction, removeFromWishlistAction, updateWishlistAction } from '@/app/actions/wishlist'
import { ItemForm, type ReleaseOption } from '@/components/collection/ItemForm'
import { Field, FormMessage, inputCls, SubmitButton, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { CartridgeCard } from '@/components/retro/CartridgeCard'
import { PixelButton } from '@/components/retro/PixelButton'
import { Sticker } from '@/components/retro/Sticker'
import {
  conditionLabel,
  ITEM_CONDITIONS,
  priorityLabel,
  WISH_PRIORITIES,
  type WishlistEntry,
} from '@/lib/backend/types'
import { cn } from '@/lib/cn'
import { formatEuro } from '@/lib/format'
import { regionLabel, type Region } from '@/lib/types'

type Props = {
  wish: WishlistEntry
  estimate: { cents: number; region: Region; demo: boolean } | null
  bargain: boolean
  releases: (ReleaseOption & { region: Region })[]
}

const priorityCls = {
  high: 'bg-sticker-red text-white',
  medium: 'bg-sticker text-ink',
  low: 'bg-surface-2 text-fg',
}

export function WishCard({ wish, estimate, bargain, releases }: Props) {
  const [mode, setMode] = useState<'view' | 'edit' | 'got'>('view')
  const preferredRelease = releases.find((r) => r.region === wish.preferredRegion)?.id

  return (
    <li className="grid gap-4 bg-surface p-4 sm:grid-cols-[6rem_1fr]">
      <CartridgeCard
        title={wish.gameTitle}
        compat={wish.compat}
        year={wish.firstReleaseYear}
        size="fluid"
        wishlisted
        className="hidden sm:block"
      />
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'px-1.5 py-0.5 font-display text-[0.6875rem] uppercase',
              priorityCls[wish.priority],
            )}
          >
            {priorityLabel[wish.priority]} priority
          </span>
          {bargain ? <Sticker kind="price">Below your max</Sticker> : null}
        </div>
        <h2 className="text-lg font-semibold">
          <Link href={`/games/${wish.gameSlug}`} className="hover:underline">
            {wish.gameTitle}
          </Link>
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="font-display text-xs text-fg-muted uppercase">Region</dt>
          <dd>{wish.preferredRegion ? regionLabel[wish.preferredRegion] : 'Any'}</dd>
          <dt className="font-display text-xs text-fg-muted uppercase">Condition</dt>
          <dd>{wish.desiredCondition ? conditionLabel[wish.desiredCondition] : 'Any'}</dd>
          <dt className="font-display text-xs text-fg-muted uppercase">Max price</dt>
          <dd className="font-mono">{formatEuro(wish.maxPriceCents) ?? '—'}</dd>
          <dt className="font-display text-xs text-fg-muted uppercase">Estimate</dt>
          <dd className="font-mono">
            {estimate ? (
              <>
                {formatEuro(estimate.cents)}{' '}
                <span className="font-sans text-fg-muted">({regionLabel[estimate.region]})</span>
                {estimate.demo ? (
                  <span className="ml-2 font-sans text-xs text-fg-muted">demo price</span>
                ) : null}
              </>
            ) : (
              '—'
            )}
          </dd>
        </dl>
        {wish.notes && mode === 'view' ? <p className="text-sm">{wish.notes}</p> : null}

        {mode === 'edit' ? <WishForm wish={wish} onDone={() => setMode('view')} /> : null}
        {mode === 'got' ? (
          <div className="bg-surface-2 p-4">
            <p className="mb-3 font-pixel text-[0.625rem]">ADD TO YOUR COLLECTION</p>
            <ItemForm
              releases={releases}
              action={gotItAction}
              returnTo="/wishlist"
              submitLabel="Add & remove from wishlist"
              hidden={{ gameId: wish.gameId }}
              defaults={{ releaseId: preferredRelease, condition: wish.desiredCondition }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <PixelButton
            size="sm"
            onClick={() => setMode(mode === 'got' ? 'view' : 'got')}
            aria-expanded={mode === 'got'}
          >
            {mode === 'got' ? 'Cancel' : 'Got it!'}
          </PixelButton>
          <PixelButton
            size="sm"
            variant="ghost"
            onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
            aria-expanded={mode === 'edit'}
          >
            {mode === 'edit' ? 'Cancel' : 'Edit'}
          </PixelButton>
          <form action={removeFromWishlistAction}>
            <input type="hidden" name="gameId" value={wish.gameId} />
            <PixelButton size="sm" variant="ghost" type="submit">
              Remove
            </PixelButton>
          </form>
        </div>
      </div>
    </li>
  )
}

function WishForm({ wish, onDone }: { wish: WishlistEntry; onDone: () => void }) {
  const { state, pending, formProps } = useForm(async (prev, data) => {
    const res = await updateWishlistAction(prev, data)
    if (res.ok) onDone()
    return res
  })
  return (
    <form {...formProps} className="space-y-4 bg-surface-2 p-4" noValidate>
      <input type="hidden" name="gameId" value={wish.gameId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Priority">
          {(a11y) => (
            <select {...a11y} name="priority" defaultValue={wish.priority} className={inputCls}>
              {WISH_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {priorityLabel[p]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Region">
          {(a11y) => (
            <select
              {...a11y}
              name="preferredRegion"
              defaultValue={wish.preferredRegion ?? ''}
              className={inputCls}
            >
              <option value="">Any</option>
              <option value="eu">Europe</option>
              <option value="us">North America</option>
              <option value="jp">Japan</option>
            </select>
          )}
        </Field>
        <Field label="Condition">
          {(a11y) => (
            <select
              {...a11y}
              name="desiredCondition"
              defaultValue={wish.desiredCondition ?? ''}
              className={inputCls}
            >
              <option value="">Any</option>
              {ITEM_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {conditionLabel[c]}
                </option>
              ))}
            </select>
          )}
        </Field>
        <TextField
          label="Max price (€)"
          name="maxPrice"
          inputMode="decimal"
          placeholder="25.00"
          defaultValue={wish.maxPriceCents != null ? (wish.maxPriceCents / 100).toFixed(2) : ''}
          error={state.errors?.maxPrice}
        />
      </div>
      <Field label="Notes" error={state.errors?.notes}>
        {(a11y) => (
          <textarea
            {...a11y}
            name="notes"
            rows={2}
            maxLength={2000}
            defaultValue={wish.notes ?? ''}
            className={inputCls + ' py-2'}
          />
        )}
      </Field>
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="sm" pending={pending}>
        Save
      </SubmitButton>
    </form>
  )
}
