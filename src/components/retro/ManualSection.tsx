import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  /** Page number printed in the corner, like an instruction booklet. */
  number: number
  title: string
  id?: string
  children: ReactNode
  className?: string
}

/** A numbered "instruction booklet" page on paper. */
export function ManualSection({ number, title, id, children, className }: Props) {
  const headingId = `${id ?? `manual-${number}`}-title`
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        'relative rounded-sm bg-paper p-5 text-ink shadow-[inset_0_0_0_2px_rgb(0_0_0/0.12),0_3px_0_0_rgb(0_0_0/0.35)] sm:p-7',
        className,
      )}
    >
      <div className="mb-4 flex items-baseline gap-3 border-b-2 border-ink/80 pb-2">
        <span aria-hidden className="font-pixel text-xs text-lcd-700">
          {String(number).padStart(2, '0')}
        </span>
        <h2 id={headingId} className="font-display text-sm tracking-wide uppercase">
          {title}
        </h2>
      </div>
      <div className="text-[0.9375rem]">{children}</div>
    </section>
  )
}
