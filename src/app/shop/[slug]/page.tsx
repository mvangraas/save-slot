import { connection } from 'next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { AddToCart } from '@/components/shop/AddToCart'
import { ProductVisual, StockBadge } from '@/components/shop/ProductVisual'
import { ShopNotice } from '@/components/shop/ShopNotice'
import { LoadingState } from '@/components/retro/LoadingState'
import { formatEuro } from '@/lib/format'
import { getProductMeta, getShopStore } from '@/lib/shop'
import { productConditionLabel } from '@/lib/shop/types'

export async function generateMetadata({ params }: PageProps<'/shop/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const p = await getProductMeta(slug)
  if (!p) return { title: 'Product not found' }
  return {
    title: p.name,
    description: (p.description || `${p.name}, ${productConditionLabel[p.condition]}.`).slice(
      0,
      160,
    ),
    openGraph: p.image ? { images: [{ url: p.image }] } : undefined,
  }
}

export default function ProductPage({ params }: PageProps<'/shop/[slug]'>) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProductBody params={params} />
    </Suspense>
  )
}

async function ProductBody({ params }: { params: PageProps<'/shop/[slug]'>['params'] }) {
  await connection() // live stock and prices: never prerender at build time
  const { slug } = await params
  const p = await getShopStore().getProduct(slug)
  if (!p) notFound()

  return (
    <article className="space-y-8">
      <nav aria-label="Breadcrumb" className="font-display text-xs text-fg-muted uppercase">
        <Link href="/shop" className="hover:text-fg">
          Shop
        </Link>
        {p.categoryName ? <> / {p.categoryName}</> : null}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <ProductVisual image={p.images[0]} name={p.name} sizes="large" />
          {p.images.length > 1 ? (
            <ul className="grid grid-cols-4 gap-2" aria-label="More photos">
              {p.images.slice(1).map((img) => (
                <li key={img.id}>
                  <a href={img.url} target="_blank" rel="noopener noreferrer">
                    <ProductVisual image={img} name={p.name} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-5">
          <header className="space-y-2">
            <p className="font-display text-xs text-fg-muted uppercase">
              {productConditionLabel[p.condition]}
            </p>
            <h1 className="font-sans text-2xl font-semibold sm:text-3xl">{p.name}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-2xl">{formatEuro(p.priceCents)}</p>
              <StockBadge stock={p.stock} />
            </div>
            <ShopNotice />
          </header>

          <AddToCart productId={p.id} stock={p.stock} />

          {p.description ? (
            <section aria-labelledby="desc-title" className="space-y-2">
              <h2 id="desc-title" className="font-display text-sm uppercase">
                Description
              </h2>
              <div className="space-y-3 whitespace-pre-line">{p.description}</div>
            </section>
          ) : null}

          {p.specs.length > 0 ? (
            <section aria-labelledby="spec-title" className="space-y-2">
              <h2 id="spec-title" className="font-display text-sm uppercase">
                Specifications
              </h2>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 bg-surface p-4 text-sm">
                {p.specs.map((s) => (
                  <div key={s.label} className="contents">
                    <dt className="text-fg-muted">{s.label}</dt>
                    <dd>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <p className="text-sm text-fg-muted">
            Questions about this item?{' '}
            <Link href="/contact" className="underline">
              Contact us
            </Link>
            . See also{' '}
            <Link href="/legal/shipping-returns" className="underline">
              shipping &amp; returns
            </Link>
            .
          </p>
        </div>
      </div>
    </article>
  )
}
