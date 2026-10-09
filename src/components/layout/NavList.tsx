import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { NavItem } from '@/config/site'

export function isActive(href: string, pathname: string | null) {
  if (!pathname) return false
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

/** Desktop header links. Pure, so it can render as the Suspense fallback too. */
export function DesktopNavList({ items, pathname }: { items: NavItem[]; pathname: string | null }) {
  return (
    <ul className="flex items-center gap-1">
      {items.map((item) => {
        const active = isActive(item.href, pathname)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex min-h-11 items-center px-3 font-display text-sm tracking-wide uppercase',
                active ? 'text-gb-text' : 'text-fg-muted hover:text-fg',
              )}
            >
              {active ? (
                <span aria-hidden className="mr-1.5">
                  ▶
                </span>
              ) : null}
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Mobile bottom bar, styled as a row of handheld buttons. */
export function BottomNavList({ items, pathname }: { items: NavItem[]; pathname: string | null }) {
  return (
    <ul className="grid grid-cols-5">
      {items.map((item) => {
        const active = isActive(item.href, pathname)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-1"
            >
              <span
                aria-hidden
                className={cn(
                  'block size-3.5 rounded-full shadow-[0_2px_0_0_rgb(0_0_0/0.5)]',
                  active ? 'bg-lcd-200' : 'bg-shell-600',
                )}
              />
              <span
                className={cn(
                  'font-display text-[0.6875rem] uppercase',
                  active ? 'text-gb-text' : 'text-fg-muted',
                )}
              >
                {item.short}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
