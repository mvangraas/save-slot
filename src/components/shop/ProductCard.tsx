import Link from 'next/link'
import { formatEuro } from '@/lib/format'
import { productConditionLabel, type Product } from '@/lib/shop/types'
import { ProductVisual, StockBadge } from './ProductVisual'

export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="group relative flex h-full flex-col bg-surface">
      <ProductVisual image={p.images[0]} name={p.name} />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-display text-xs text-fg-muted uppercase">
          {p.categoryName ? `${p.categoryName} · ` : ''}
          {productConditionLabel[p.condition]}
        </p>
        <h3 className="font-sans text-base leading-snug font-semibold">
          <Link href={`/shop/${p.slug}`} className="after:absolute after:inset-0 hover:underline">
            {p.name}
          </Link>
        </h3>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-lg">{formatEuro(p.priceCents)}</p>
          <StockBadge stock={p.stock} />
        </div>
      </div>
    </article>
  )
}
