'use client'

import Link from 'next/link'
import { useState } from 'react'
import { bulkCollectionAction } from '@/app/actions/collection'
import { FormMessage, inputCls, SubmitButton } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PlatformBadge } from '@/components/retro/PlatformBadge'
import { RegionTag } from '@/components/retro/RegionTag'
import { conditionLabel, type CollectionItem } from '@/lib/backend/types'
import { formatEuro } from '@/lib/format'

/** Table of copies with checkboxes and bulk actions (remove, move to wishlist, set play status). */
export function CopiesTable({
  items,
  values,
}: {
  items: CollectionItem[]
  values: Record<string, number | null>
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const { state, pending, formProps } = useForm(bulkCollectionAction)
  const all = selected.size === items.length && items.length > 0
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const yes = (b: boolean) => (b ? '✔' : '—')

  return (
    <form
      {...formProps}
      onSubmit={(e) => {
        const op = new FormData(e.currentTarget).get('op')
        if (op === 'remove' && !window.confirm(`Remove ${selected.size} selected copies?`)) {
          e.preventDefault()
          return
        }
        formProps.onSubmit(e)
        setSelected(new Set())
      }}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end gap-3 rounded-sm bg-surface p-3">
        <p className="min-h-11 content-center font-display text-xs uppercase" aria-live="polite">
          {selected.size} selected
        </p>
        <label className="sr-only" htmlFor="bulk-op">
          Bulk action
        </label>
        <select id="bulk-op" name="op" defaultValue="playing" className={inputCls + ' w-auto'}>
          <option value="playing">Mark games as Playing</option>
          <option value="completed">Mark games as Completed</option>
          <option value="backlog">Put games in Backlog</option>
          <option value="to-wishlist">Move to wishlist</option>
          <option value="remove">Remove copies</option>
        </select>
        <SubmitButton size="sm" pending={pending} variant="secondary">
          Apply
        </SubmitButton>
      </div>
      <FormMessage ok={state.ok} message={state.message} />

      <div className="overflow-x-auto rounded-sm bg-surface">
        <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
          <caption className="sr-only">Your copies</caption>
          <thead>
            <tr className="border-b-2 border-line font-display text-xs text-fg-muted uppercase">
              <th scope="col" className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  aria-label="Select all copies"
                  checked={all}
                  onChange={() => setSelected(all ? new Set() : new Set(items.map((i) => i.id)))}
                  className="size-4 accent-lcd-700"
                />
              </th>
              <th scope="col" className="px-3 py-2">
                Title
              </th>
              <th scope="col" className="px-3 py-2">
                Platform
              </th>
              <th scope="col" className="px-3 py-2">
                Region
              </th>
              <th scope="col" className="px-3 py-2">
                Cart
              </th>
              <th scope="col" className="px-3 py-2">
                Box
              </th>
              <th scope="col" className="px-3 py-2">
                Manual
              </th>
              <th scope="col" className="px-3 py-2">
                Condition
              </th>
              <th scope="col" className="px-3 py-2">
                Paid
              </th>
              <th scope="col" className="px-3 py-2">
                Est. value
              </th>
              <th scope="col" className="px-3 py-2">
                Bought
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b border-line/50 last:border-0">
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    name="ids"
                    value={i.id}
                    aria-label={`Select ${i.gameTitle} (${i.region.toUpperCase()})`}
                    checked={selected.has(i.id)}
                    onChange={() => toggle(i.id)}
                    className="size-4 accent-lcd-700"
                  />
                </td>
                <th scope="row" className="px-3 py-2 font-medium">
                  <Link href={`/games/${i.gameSlug}#your-copies`} className="hover:underline">
                    {i.gameTitle}
                  </Link>
                </th>
                <td className="px-3 py-2">
                  <PlatformBadge platform={i.platform} />
                </td>
                <td className="px-3 py-2">
                  <RegionTag region={i.region} />
                </td>
                <td className="px-3 py-2">{yes(i.hasCart)}</td>
                <td className="px-3 py-2">{yes(i.hasBox)}</td>
                <td className="px-3 py-2">{yes(i.hasManual)}</td>
                <td className="px-3 py-2">{i.condition ? conditionLabel[i.condition] : '—'}</td>
                <td className="px-3 py-2 font-mono">{formatEuro(i.purchasePriceCents) ?? '—'}</td>
                <td className="px-3 py-2 font-mono">{formatEuro(values[i.id]) ?? '—'}</td>
                <td className="px-3 py-2 font-mono">{i.purchasedOn ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  )
}
