import { cn } from '@/lib/cn'
import type { ProductImage } from '@/lib/shop/types'

/** First product photo, or an LCD-style placeholder when the owner hasn't added one yet. */
export function ProductVisual({
  image,
  name,
  className,
  sizes = 'small',
}: {
  image: ProductImage | undefined
  name: string
  className?: string
  sizes?: 'small' | 'large'
}) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- owner-uploaded, already resized
      <img
        src={image.url}
        alt={image.alt ?? name}
        loading={sizes === 'large' ? 'eager' : 'lazy'}
        className={cn('aspect-square w-full bg-surface-2 object-cover', className)}
      />
    )
  }
  return (
    <div
      role="img"
      aria-label={`${name} (no photo yet)`}
      className={cn(
        'grid aspect-square w-full place-items-center bg-lcd-200 p-4 text-center text-lcd-900',
        className,
      )}
    >
      <span
        className={cn(
          'font-pixel leading-relaxed',
          sizes === 'large' ? 'text-sm' : 'text-[0.625rem]',
        )}
      >
        NO PHOTO YET
      </span>
    </div>
  )
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="bg-shell-600 px-2 py-0.5 font-display text-xs text-white uppercase">
        Sold out
      </span>
    )
  }
  if (stock <= 2) {
    return (
      <span className="bg-sticker px-2 py-0.5 font-display text-xs text-ink uppercase">
        Only {stock} left
      </span>
    )
  }
  return (
    <span className="bg-lcd-200 px-2 py-0.5 font-display text-xs text-lcd-900 uppercase">
      In stock
    </span>
  )
}
