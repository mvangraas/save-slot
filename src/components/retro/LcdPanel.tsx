import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Platform } from '@/lib/types'

type Props = {
  children: ReactNode
  /** gb = classic green LCD · gbc = berry/purple panel */
  tone?: Platform
  scanlines?: boolean
  /** Small engraved label above the screen, like the bezel text on a handheld. */
  bezelLabel?: string
  className?: string
  screenClassName?: string
  as?: 'section' | 'div' | 'aside'
  'aria-labelledby'?: string
}

/**
 * A "screen inside a bezel". Text colours are fixed per tone so contrast is
 * guaranteed regardless of light/dark theme (see contrast tests).
 */
export function LcdPanel({
  children,
  tone = 'gb',
  scanlines = true,
  bezelLabel,
  className,
  screenClassName,
  as: Tag = 'div',
  ...rest
}: Props) {
  return (
    <Tag
      className={cn(
        'rounded-md bg-shell-800 p-3 shadow-[inset_0_2px_0_rgb(255_255_255/0.06),0_2px_0_rgb(0_0_0/0.4)] sm:p-4',
        className,
      )}
      {...rest}
    >
      {bezelLabel ? (
        <div className="mb-2 flex items-center gap-2 font-display text-[0.6875rem] tracking-widest text-shell-300 uppercase">
          <span aria-hidden className="h-0.5 flex-1 bg-shell-600" />
          {bezelLabel}
          <span aria-hidden className="h-0.5 flex-1 bg-shell-600" />
        </div>
      ) : null}
      <div
        data-tone={tone}
        className={cn(
          'relative overflow-hidden rounded-sm p-4 shadow-[inset_0_0_0_2px_rgb(0_0_0/0.25),inset_0_6px_12px_rgb(0_0_0/0.18)] sm:p-6',
          tone === 'gb' ? 'bg-lcd-200 text-lcd-900' : 'bg-gbc-50 text-gbc-deep',
          scanlines && 'scanlines',
          screenClassName,
        )}
      >
        {tone === 'gbc' ? (
          <span aria-hidden className="absolute inset-x-0 top-0 flex h-1">
            <span className="flex-1 bg-[#d6455a]" />
            <span className="flex-1 bg-[#f2b134]" />
            <span className="flex-1 bg-[#4caf68]" />
            <span className="flex-1 bg-[#3f7fd0]" />
            <span className="flex-1 bg-gbc" />
          </span>
        ) : null}
        <div className="relative z-[2]">{children}</div>
      </div>
    </Tag>
  )
}
