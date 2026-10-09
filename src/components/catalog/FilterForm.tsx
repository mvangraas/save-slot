'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { PixelButton } from '@/components/retro/PixelButton'
import {
  featureLabel,
  GAME_FEATURES,
  GAME_SORTS,
  sortLabel,
  type Facets,
  type GameQuery,
} from '@/lib/catalog/types'
import { compatLabel, regionLabel, type CartCompat, type Platform, type Region } from '@/lib/types'
import { SearchBox } from './SearchBox'

type Props = {
  basePath: string
  query: GameQuery
  facets: Facets
  view: 'grid' | 'list'
  /** Fixed platform on /gb and /gbc. */
  presetPlatform?: Platform
  filtersOpen?: boolean
}

const fieldset = 'space-y-2'
const legend = 'mb-2 font-display text-xs tracking-wide text-fg-muted uppercase'
const optionRow = 'flex min-h-9 cursor-pointer items-center gap-2 text-sm'
const selectCls =
  'min-h-11 w-full rounded-none border-2 border-line bg-surface px-2 text-sm text-fg focus-visible:outline-3'

/**
 * The whole catalogue toolbar is one GET form: works without JS, and with JS
 * checkboxes/selects apply immediately via client-side navigation (next/form).
 */
export function FilterForm({ basePath, query, facets, view, presetPlatform, filtersOpen }: Props) {
  const router = useRouter()
  const f = query.filters
  const compatOptions: CartCompat[] =
    presetPlatform === 'gb'
      ? []
      : presetPlatform === 'gbc'
        ? ['gbc_dual', 'gbc_only']
        : ['gb', 'gbc_dual', 'gbc_only']
  const years: number[] = []
  for (let y = facets.yearMin ?? 1989; y <= (facets.yearMax ?? 2003); y++) years.push(y)

  return (
    <form
      action={basePath}
      method="get"
      role="search"
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        router.push(cleanUrl(basePath, new FormData(e.currentTarget), !!query.q), { scroll: false })
      }}
      onChange={(e) => {
        const t = e.target as HTMLElement
        if (t instanceof HTMLInputElement && t.type === 'search') return
        e.currentTarget.requestSubmit()
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchBox defaultValue={query.q ?? ''} />
        </div>
        <div className="flex gap-3">
          <label className="sr-only" htmlFor="sort">
            Sort
          </label>
          <select id="sort" name="sort" defaultValue={query.sort} className={selectCls}>
            {GAME_SORTS.filter((s) => s !== 'relevance' || query.q).map((s) => (
              <option key={s} value={s}>
                {sortLabel[s]}
              </option>
            ))}
          </select>
          <fieldset className="flex shrink-0">
            <legend className="sr-only">View</legend>
            {(['grid', 'list'] as const).map((v) => (
              <label
                key={v}
                className="relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center bg-surface-2 px-2 font-display text-xs uppercase has-[:checked]:bg-lcd-200 has-[:checked]:text-lcd-900 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus"
              >
                <input
                  type="radio"
                  name="view"
                  value={v}
                  defaultChecked={view === v}
                  className="sr-only"
                />
                {v === 'grid' ? 'Shelf' : 'Index'}
              </label>
            ))}
          </fieldset>
        </div>
      </div>

      <details className="group rounded-sm bg-surface" open={filtersOpen}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 font-display text-sm uppercase">
          Filters
          <span aria-hidden className="transition-transform group-open:rotate-90">
            ▶
          </span>
        </summary>
        <div className="grid gap-6 px-4 pt-2 pb-5 sm:grid-cols-2 lg:grid-cols-4">
          {!presetPlatform ? (
            <fieldset className={fieldset}>
              <legend className={legend}>Platform</legend>
              {(
                [
                  ['', 'All'],
                  ['gb', 'Game Boy'],
                  ['gbc', 'Game Boy Color'],
                ] as const
              ).map(([v, label]) => (
                <label key={v || 'all'} className={optionRow}>
                  <input
                    type="radio"
                    name="platform"
                    value={v}
                    defaultChecked={(f.platform ?? '') === v}
                    className="size-4 accent-lcd-700"
                  />
                  {label}
                  {v ? <Count n={facets.platformCounts[v]} /> : null}
                </label>
              ))}
            </fieldset>
          ) : null}

          {compatOptions.length > 0 ? (
            <fieldset className={fieldset}>
              <legend className={legend}>Cartridge</legend>
              {compatOptions.map((c) => (
                <Check key={c} name="compat" value={c} checked={f.compat?.includes(c)}>
                  {compatLabel[c]}
                </Check>
              ))}
            </fieldset>
          ) : null}

          <fieldset className={fieldset}>
            <legend className={legend}>Region</legend>
            {(['eu', 'us', 'jp'] as Region[]).map((r) => (
              <Check key={r} name="region" value={r} checked={f.regions?.includes(r)}>
                {regionLabel[r]}
              </Check>
            ))}
          </fieldset>

          <fieldset className={fieldset}>
            <legend className={legend}>Genre</legend>
            {facets.genres.map((g) => (
              <Check key={g.slug} name="genre" value={g.slug} checked={f.genres?.includes(g.slug)}>
                {g.name} <Count n={g.count} />
              </Check>
            ))}
          </fieldset>

          <fieldset className={fieldset}>
            <legend className={legend}>Release year</legend>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor="from">
                From year
              </label>
              <select id="from" name="from" defaultValue={f.yearFrom ?? ''} className={selectCls}>
                <option value="">From</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <span aria-hidden>–</span>
              <label className="sr-only" htmlFor="to">
                Until year
              </label>
              <select id="to" name="to" defaultValue={f.yearTo ?? ''} className={selectCls}>
                <option value="">Until</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <FacetSelect
            id="publisher"
            label="Publisher"
            options={facets.publishers}
            value={f.publisher}
          />
          <FacetSelect
            id="developer"
            label="Developer"
            options={facets.developers}
            value={f.developer}
          />
          <FacetSelect id="series" label="Series" options={facets.series} value={f.series} />

          <fieldset className={fieldset}>
            <legend className={legend}>Features</legend>
            {GAME_FEATURES.map((k) => (
              <Check key={k} name="feature" value={k} checked={f.features?.includes(k)}>
                {featureLabel[k]}
              </Check>
            ))}
          </fieldset>
        </div>
        <div className="px-4 pb-4">
          <PixelButton type="submit" size="sm">
            Apply
          </PixelButton>
        </div>
      </details>
    </form>
  )
}

function Check({
  name,
  value,
  checked,
  children,
}: {
  name: string
  value: string
  checked?: boolean
  children: ReactNode
}) {
  return (
    <label className={optionRow}>
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className="size-4 accent-lcd-700"
      />
      <span>{children}</span>
    </label>
  )
}

function Count({ n }: { n: number }) {
  return <span className="font-mono text-xs text-fg-muted">({n})</span>
}

function FacetSelect({
  id,
  label,
  options,
  value,
}: {
  id: string
  label: string
  options: { slug: string; name: string; count: number }[]
  value?: string
}) {
  return (
    <div className={fieldset}>
      <label htmlFor={id} className={legend + ' block'}>
        {label}
      </label>
      <select id={id} name={id} defaultValue={value ?? ''} className={selectCls}>
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.name} ({o.count})
          </option>
        ))}
      </select>
    </div>
  )
}

/** Build a tidy URL: drop empty fields and defaults so links stay short and shareable. */
export function cleanUrl(basePath: string, data: FormData, hadQuery = false): string {
  const p = new URLSearchParams()
  const hasQuery = String(data.get('q') ?? '').trim() !== ''
  for (const [k, v] of data.entries()) {
    const value = typeof v === 'string' ? v.trim() : ''
    if (!value) continue
    if (k === 'view' && value === 'grid') continue
    if (k === 'sort' && value === (hasQuery ? 'relevance' : 'title')) continue
    // A new search starts in "best match" order instead of keeping the A–Z default.
    if (k === 'sort' && hasQuery && !hadQuery && value === 'title') continue
    p.append(k, value)
  }
  const s = p.toString()
  return s ? `${basePath}?${s}` : basePath
}
