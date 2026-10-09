import Link from 'next/link'
import { cn } from '@/lib/cn'
import { compatLabel, platformOf, type CartCompat, type Region } from '@/lib/types'
import { PlatformBadge } from './PlatformBadge'
import { RegionTag } from './RegionTag'
import { Sticker } from './Sticker'

export type CartridgeCardProps = {
  title: string
  compat: CartCompat
  year?: number | null
  regions?: Region[]
  owned?: boolean
  wishlisted?: boolean
  href?: string
  /** `fluid` fills its grid cell. */
  size?: 'sm' | 'md' | 'lg' | 'fluid'
  className?: string
}

const shell: Record<CartCompat, string> = {
  gb: 'bg-cart-grey text-ink',
  gbc_dual: 'bg-cart-black text-[#ececea]',
  // translucent "clear" GBC-only cartridge
  gbc_only:
    'bg-[linear-gradient(160deg,rgb(195_155_211/0.55),rgb(142_68_173/0.35))] text-ink backdrop-blur-[1px]',
}

const groove: Record<CartCompat, string> = {
  gb: 'bg-cart-grey-dark',
  gbc_dual: 'bg-cart-black-dark',
  gbc_only: 'bg-gbc/40',
}

const label: Record<CartCompat, string> = {
  gb: 'bg-[linear-gradient(180deg,var(--color-lcd-50),var(--color-lcd-400))] text-lcd-900',
  gbc_dual: 'bg-[linear-gradient(180deg,var(--color-gbc-50),var(--color-gbc-soft))] text-gbc-deep',
  gbc_only: 'bg-[linear-gradient(180deg,var(--color-gbc-50),var(--color-gbc-soft))] text-gbc-deep',
}

const widths = { sm: 'w-32', md: 'w-44', lg: 'w-56', fluid: 'w-full' } as const
const titleSize = {
  sm: 'text-[0.5rem]',
  md: 'text-[0.625rem]',
  lg: 'text-xs',
  fluid: 'text-[0.5rem] sm:text-[0.5625rem] lg:text-[0.625rem]',
} as const

/**
 * A game shown as a cartridge: one cut corner, grip grooves on top and a label
 * with the title. Colour of the plastic follows the real cart type.
 * The clip-path sits on an inner element so the focus outline of the link stays visible.
 */
export function CartridgeCard({
  title,
  compat,
  year,
  regions = [],
  owned = false,
  wishlisted = false,
  href,
  size = 'md',
  className,
}: CartridgeCardProps) {
  const platform = platformOf(compat)

  const body = (
    <div
      className={cn(
        'relative flex aspect-[57/65] flex-col p-[7%] pt-[9%] shadow-[inset_-3px_-3px_0_rgb(0_0_0/0.18),inset_3px_3px_0_rgb(255_255_255/0.18)] cart-shape',
        shell[compat],
      )}
    >
      {/* grip grooves */}
      <div aria-hidden className="mb-[6%] flex flex-col gap-[3px] pr-[14%]">
        <span className={cn('h-[3px] w-full', groove[compat])} />
        <span className={cn('h-[3px] w-full', groove[compat])} />
      </div>

      {/* label */}
      <div
        className={cn(
          'relative flex flex-1 flex-col justify-between rounded-[3px] p-[8%] shadow-[inset_0_0_0_2px_rgb(0_0_0/0.15)]',
          label[compat],
        )}
      >
        <div className="flex items-start justify-between gap-1">
          <PlatformBadge platform={platform} />
          {year ? <span className="font-display text-[0.6875rem] leading-none">{year}</span> : null}
        </div>
        <p className={cn('line-clamp-4 font-pixel leading-relaxed break-words', titleSize[size])}>
          {title}
        </p>
        {regions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {regions.map((r) => (
              <RegionTag key={r} region={r} />
            ))}
          </div>
        ) : null}
      </div>

      {/* stickers */}
      <div className="pointer-events-none absolute right-[4%] bottom-[3%] flex flex-col items-end gap-1">
        {owned ? <Sticker kind="owned" tilt /> : null}
      </div>
      {wishlisted ? (
        <span className="absolute top-[11%] left-[5%] text-power" title="On your wishlist">
          <span aria-hidden>♥</span>
          <span className="sr-only">On your wishlist</span>
        </span>
      ) : null}
    </div>
  )

  const a11yLabel = `${title}, ${compatLabel[compat]}${year ? `, ${year}` : ''}${owned ? ', owned' : ''}${wishlisted ? ', on wishlist' : ''}`

  const wrapperClass = cn(
    'group block shrink-0 drop-shadow-[0_3px_0_rgb(0_0_0/0.35)] transition-transform duration-100 ease-out',
    href && 'hover:-translate-y-1 focus-visible:-translate-y-1',
    widths[size],
    className,
  )

  if (href) {
    return (
      <Link href={href} aria-label={a11yLabel} className={wrapperClass}>
        {body}
      </Link>
    )
  }
  return (
    <div role="img" aria-label={a11yLabel} className={wrapperClass}>
      {body}
    </div>
  )
}

export function CartridgeCardSkeleton({
  size = 'md',
  className,
}: Pick<CartridgeCardProps, 'size' | 'className'>) {
  return (
    <div aria-hidden className={cn('shrink-0', widths[size], className)}>
      <div className="aspect-[57/65] animate-pulse bg-surface-2 cart-shape" />
    </div>
  )
}
