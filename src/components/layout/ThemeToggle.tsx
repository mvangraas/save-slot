'use client'

import { THEME_KEY } from '@/config/boot-script'
import { setHtmlAttribute, useHtmlAttribute } from '@/lib/html-attr-store'
import { cn } from '@/lib/cn'

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useHtmlAttribute('data-theme')
  const isLight = theme === 'light'
  return (
    <button
      type="button"
      onClick={() => setHtmlAttribute('data-theme', isLight ? 'dark' : 'light', THEME_KEY)}
      aria-pressed={isLight}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm font-display text-xs text-fg-muted uppercase hover:bg-surface-2 hover:text-fg',
        className,
      )}
    >
      <span aria-hidden className="text-base leading-none">
        {isLight ? '☀' : '☾'}
      </span>
      <span className="sr-only">Light mode</span>
    </button>
  )
}
