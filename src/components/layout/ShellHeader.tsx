import Link from 'next/link'
import { Suspense } from 'react'
import { desktopNav, platformNav } from '@/config/site'
import { ActiveDesktopNav } from './ActiveNav'
import { Logo } from './Logo'
import { DesktopNavList } from './NavList'
import { ThemeToggle } from './ThemeToggle'
import { UserSlot, UserSlotFallback } from './UserSlot'

export function ShellHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-shell-950 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden lg:block">
          <Suspense fallback={<DesktopNavList items={desktopNav} pathname={null} />}>
            <ActiveDesktopNav items={desktopNav} />
          </Suspense>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <nav aria-label="Platforms" className="hidden sm:block">
            <ul className="flex gap-1">
              {platformNav.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className={
                      'inline-flex min-h-11 items-center px-2 font-pixel text-[0.625rem] ' +
                      (p.href === '/gb' ? 'text-gb-text' : 'text-gbc-text')
                    }
                    aria-label={p.label}
                  >
                    {p.short}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
          <Suspense fallback={<UserSlotFallback />}>
            <UserSlot />
          </Suspense>
        </div>
      </div>
      {/* power LED strip */}
      <div aria-hidden className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 pb-1">
        <span className="size-1.5 animate-led-on rounded-full bg-power shadow-[0_0_6px_1px_rgb(229_50_45/0.6)]" />
        <span className="font-display text-[0.5625rem] tracking-[0.2em] text-fg-muted uppercase">
          Power
        </span>
      </div>
    </header>
  )
}
