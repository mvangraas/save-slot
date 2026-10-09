import Link from 'next/link'
import { cn } from '@/lib/cn'

/** Original pixel mark: a cartridge with a save-heart. Not based on any Nintendo artwork. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 14"
      aria-hidden
      shapeRendering="crispEdges"
      className={cn('h-7 w-6', className)}
    >
      <path fill="var(--color-shell-300)" d="M0 0h10v1h1v1h1v12H0z" />
      <path fill="var(--color-shell-600)" d="M1 1h8v1H1zM1 3h8v1H1z" />
      <path fill="var(--color-lcd-200)" d="M2 5h8v7H2z" />
      <path fill="var(--color-lcd-900)" d="M4 7h1v1h1V7h1v2H6v1H5V9H4z" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('inline-flex min-h-11 items-center gap-2.5', className)}>
      <LogoMark />
      <span className="font-pixel text-[0.8125rem] leading-none tracking-tight text-fg">
        SAVE<span className="text-gb-text">SLOT</span>
      </span>
    </Link>
  )
}
