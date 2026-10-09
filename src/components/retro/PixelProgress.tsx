import { cn } from '@/lib/cn'
import type { Platform } from '@/lib/types'

type Props = {
  value: number
  max: number
  label: string
  tone?: Platform
  blocks?: number
  className?: string
}

/** Blocks that fill up like a 1990s loading bar. Exposes a real progressbar to assistive tech. */
export function PixelProgress({ value, max, label, tone = 'gb', blocks = 20, className }: Props) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const filled = Math.round((pct / 100) * blocks)
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-display uppercase">{label}</span>
        <span className="font-mono">
          {value}/{max} · {pct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${value} of ${max} (${pct}%)`}
        className="flex gap-[3px] bg-shell-950 p-[3px]"
      >
        {Array.from({ length: blocks }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-3 flex-1',
              i < filled ? (tone === 'gb' ? 'bg-lcd-200' : 'bg-gbc-soft') : 'bg-shell-800',
            )}
          />
        ))}
      </div>
    </div>
  )
}
