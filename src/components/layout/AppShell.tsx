import { Suspense, type ReactNode } from 'react'
import { UnlockToasts } from '@/components/achievements/UnlockToasts'
import { BottomNav } from './BottomNav'
import { Footer } from './Footer'
import { ShellHeader } from './ShellHeader'
import { SoundFx } from './SoundFx'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 bg-sticker px-4 py-2 font-display text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <ShellHeader />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 sm:pt-10">
        {children}
      </main>
      <Footer />
      <BottomNav />
      <Suspense fallback={null}>
        <UnlockToasts />
      </Suspense>
      <SoundFx />
    </>
  )
}
