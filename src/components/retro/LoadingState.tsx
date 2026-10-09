import { cn } from '@/lib/cn'

type Props = { label?: string; className?: string }

/** Power LED switching on + blinking block cursor. Announced politely to screen readers. */
export function LoadingState({ label = 'Loading', className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center justify-center gap-3 py-10 text-fg-muted', className)}
    >
      <span
        aria-hidden
        className="size-2.5 animate-led-on rounded-full bg-power shadow-[0_0_8px_2px_rgb(229_50_45/0.6)]"
      />
      <span className="font-display text-sm tracking-widest uppercase">
        {label}
        <span aria-hidden>…</span>
        <span
          aria-hidden
          className="ml-1 inline-block h-[1em] w-[0.6em] translate-y-[2px] animate-blink bg-current"
        />
      </span>
    </div>
  )
}
