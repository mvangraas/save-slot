import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type StickerKind = 'cib' | 'boxed' | 'import' | 'sgb' | 'rumble' | 'owned' | 'price' | 'new'

const presets: Record<StickerKind, { label: string; title: string; className: string }> = {
  cib: { label: 'CIB', title: 'Complete in box', className: 'bg-sticker text-ink' },
  boxed: { label: 'BOXED', title: 'Has the box', className: 'bg-paper text-ink' },
  import: { label: 'JP IMPORT', title: 'Japanese import', className: 'bg-sticker-red text-white' },
  sgb: { label: 'SGB', title: 'Super Game Boy enhanced', className: 'bg-gbc-deep text-gbc-50' },
  rumble: { label: 'RUMBLE', title: 'Rumble cartridge', className: 'bg-shell-800 text-sticker' },
  owned: { label: 'OWNED', title: 'In your collection', className: 'bg-lcd-200 text-lcd-900' },
  price: { label: 'PRICE', title: 'Estimated value', className: 'bg-sticker text-ink' },
  new: { label: 'NEW', title: 'New', className: 'bg-sticker-red text-white' },
}

type Props = {
  kind: StickerKind
  /** Overrides the preset label, e.g. a price "€24". */
  children?: ReactNode
  /** Slight hand-applied tilt. */
  tilt?: boolean
  className?: string
}

export function Sticker({ kind, children, tilt = false, className }: Props) {
  const preset = presets[kind]
  return (
    <span
      title={preset.title}
      className={cn(
        'inline-block rounded-[3px] px-1.5 py-0.5 font-display text-[0.6875rem] leading-4 uppercase shadow-[1px_1px_0_0_rgb(0_0_0/0.35)]',
        tilt && '-rotate-3',
        preset.className,
        className,
      )}
    >
      <span className="sr-only">{preset.title}: </span>
      {children ?? preset.label}
    </span>
  )
}
