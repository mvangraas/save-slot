import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** `screen` = for use on top of a green LcdPanel. */
type Variant = 'primary' | 'secondary' | 'ghost' | 'screen'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-display uppercase tracking-wide select-none ' +
  'transition-[transform,box-shadow] duration-75 ease-out ' +
  'active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const variants: Record<Variant, string> = {
  primary:
    'bg-lcd-200 text-lcd-900 shadow-[0_4px_0_0_var(--color-lcd-700)] hover:bg-lcd-50 active:shadow-[0_2px_0_0_var(--color-lcd-700)]',
  secondary:
    'bg-surface-2 text-fg shadow-[0_4px_0_0_var(--border)] hover:brightness-110 active:shadow-[0_2px_0_0_var(--border)]',
  ghost: 'bg-transparent text-fg hover:bg-surface-2 active:translate-y-0',
  screen:
    'bg-lcd-900 text-lcd-200 shadow-[0_4px_0_0_#000] hover:bg-lcd-700 active:shadow-[0_2px_0_0_#000]',
}

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-13 px-6 text-base',
}

type CommonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

type ButtonProps = CommonProps &
  Omit<ComponentProps<'button'>, 'className' | 'children'> & { href?: undefined }
type LinkProps = CommonProps &
  Omit<ComponentProps<typeof Link>, 'className' | 'children'> & { href: string }

export function pixelButtonClasses(
  variant: Variant = 'primary',
  size: Size = 'md',
  className?: string,
) {
  return cn(base, variants[variant], sizes[size], className)
}

/** Chunky 8-bit button that "presses in" 2px. Renders a Next.js Link when `href` is given. */
export function PixelButton(props: ButtonProps | LinkProps) {
  if (typeof props.href === 'string') {
    const { variant, size, className, children, ...rest } = props as LinkProps
    return (
      <Link className={pixelButtonClasses(variant, size, className)} {...rest}>
        {children}
      </Link>
    )
  }
  const { variant, size, className, children, type = 'button', ...rest } = props as ButtonProps
  return (
    <button type={type} className={pixelButtonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}
