import { Suspense } from 'react'
import { primaryNav } from '@/config/site'
import { ActiveBottomNav } from './ActiveNav'
import { BottomNavList } from './NavList'

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t-4 border-shell-950 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <Suspense fallback={<BottomNavList items={primaryNav} pathname={null} />}>
        <ActiveBottomNav items={primaryNav} />
      </Suspense>
    </nav>
  )
}
