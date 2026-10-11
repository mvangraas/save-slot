import { connection } from 'next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { ProductCard } from '@/components/shop/ProductCard'
import { ShopNotice } from '@/components/shop/ShopNotice'
import { EmptyState } from '@/components/retro/EmptyState'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { inputCls } from '@/components/forms/fieldStyles'
import { getShopStore } from '@/lib/shop'
import { checkoutAvailability } from '@/lib/shop/availability'
import { productQuerySchema } from '@/lib/shop/schemas'
import { productConditionLabel, PRODUCT_CONDITIONS } from '@/lib/shop/types'

export const metadata: Metadata = {
  title: 'Shop',
  description:
    'Game Boy and Game Boy Color games, consoles and accessories, checked and ready to play.',
}

const PAGE_SIZE = 24

export default function ShopPage({ searchParams }: PageProps<'/shop'>) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">SHOP</h1>
        <p className="max-w-prose text-fg-muted">
          Game Boy and Game Boy Color games, consoles and accessories. Every item is described with
          its real condition.
        </p>
        <ShopNotice />
      </header>
      <Suspense fallback={<LoadingState label="Stocking the shelves" />}>
        <ShopBody searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function ShopBody({ searchParams }: { searchParams: PageProps<'/shop'>['searchParams'] }) {
  await connection() // live stock and prices: never prerender at build time
  const raw = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
  const q = productQuerySchema.parse({
    q: one(raw.q),
    category: one(raw.category),
    condition: one(raw.condition),
    inStock: one(raw.inStock),
    sort: one(raw.sort),
    page: one(raw.page),
  })
  const store = getShopStore()
  const [categories, { items, total }] = await Promise.all([
    store.listCategories(),
    store.listProducts({ ...q, pageSize: PAGE_SIZE }),
  ])
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filtered = Boolean(q.q || q.category || q.condition || q.inStock)
  const pageHref = (page: number) => {
    const p = new URLSearchParams()
    if (q.q) p.set('q', q.q)
    if (q.category) p.set('category', q.category)
    if (q.condition) p.set('condition', q.condition)
    if (q.inStock) p.set('inStock', '1')
    if (q.sort !== 'newest') p.set('sort', q.sort)
    if (page > 1) p.set('page', String(page))
    const s = p.toString()
    return s ? `/shop?${s}` : '/shop'
  }
  const checkout = checkoutAvailability()

  return (
    <div className="space-y-6">
      {!checkout.open ? (
        <p className="border-l-4 border-sticker bg-surface p-3 text-sm">
          The shop is being set up: you can browse and fill your cart, but ordering opens soon.
        </p>
      ) : null}

      <form
        role="search"
        aria-label="Search and filter products"
        action="/shop"
        className="grid gap-3 bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
      >
        <label className="flex flex-col gap-1">
          <span className="font-display text-xs text-fg-muted uppercase">Search</span>
          <input name="q" defaultValue={q.q ?? ''} placeholder="e.g. Tetris" className={inputCls} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-display text-xs text-fg-muted uppercase">Category</span>
          <select name="category" defaultValue={q.category ?? ''} className={inputCls}>
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-display text-xs text-fg-muted uppercase">Condition</span>
          <select name="condition" defaultValue={q.condition ?? ''} className={inputCls}>
            <option value="">Any</option>
            {PRODUCT_CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {productConditionLabel[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-display text-xs text-fg-muted uppercase">Sort</span>
          <select name="sort" defaultValue={q.sort} className={inputCls}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-1">
          <label className="inline-flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="inStock"
              value="1"
              defaultChecked={q.inStock}
              className="size-5"
            />
            In stock
          </label>
          <PixelButton type="submit" variant="secondary">
            Apply
          </PixelButton>
        </div>
      </form>

      <p className="font-display text-sm uppercase" aria-live="polite">
        {total} product{total === 1 ? '' : 's'}
        {filtered ? (
          <>
            {' · '}
            <Link href="/shop" className="underline">
              Clear filters
            </Link>
          </>
        ) : null}
      </p>

      {items.length === 0 ? (
        <EmptyState
          title={filtered ? 'NO MATCHES' : 'SHELVES ARE EMPTY'}
          description={
            <p>
              {filtered
                ? 'Nothing matches these filters. Try fewer filters or another search.'
                : 'New stock is on its way. Meanwhile you can browse the game archive.'}
            </p>
          }
          action={
            <PixelButton href={filtered ? '/shop' : '/games'} variant="screen">
              {filtered ? 'Show all products' : 'Browse games'}
            </PixelButton>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-center gap-3">
          {q.page > 1 ? (
            <PixelButton href={pageHref(q.page - 1)} variant="secondary" size="sm">
              ← Previous
            </PixelButton>
          ) : null}
          <span className="font-display text-sm">
            Page {q.page} of {pages}
          </span>
          {q.page < pages ? (
            <PixelButton href={pageHref(q.page + 1)} variant="secondary" size="sm">
              Next →
            </PixelButton>
          ) : null}
        </nav>
      ) : null}
    </div>
  )
}
