import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AchievementSticker } from '@/components/achievements/AchievementSticker'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { PixelProgress } from '@/components/retro/PixelProgress'
import { ACHIEVEMENTS } from '@/lib/achievements/definitions'
import { getUserContext } from '@/lib/backend'

export const metadata: Metadata = {
  title: 'Achievements',
  description: 'The Save Slot sticker sheet: achievements you unlock by building your collection.',
}

export default function AchievementsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">ACHIEVEMENTS</h1>
        <p className="mt-2 text-fg-muted">
          Your sticker sheet. Unlocked stickers show in colour; the rest are still a mystery.
        </p>
      </header>
      <Suspense fallback={<LoadingState label="Peeling stickers" />}>
        <Sheet />
      </Suspense>
    </div>
  )
}

async function Sheet() {
  const ctx = await getUserContext()
  let unlocked = new Map<string, string>()
  let fresh = new Set<string>()
  if (ctx) {
    // Catch up on anything earned before achievements existed (idempotent, server-side).
    fresh = new Set(await ctx.store.evaluateAchievements().catch(() => []))
    unlocked = new Map((await ctx.store.listAchievements()).map((a) => [a.code, a.unlockedAt]))
  }
  const total = ACHIEVEMENTS.length

  return (
    <div className="space-y-8">
      {ctx ? (
        <section aria-label="Progress" className="rounded-sm bg-surface p-5">
          <PixelProgress label="Stickers collected" value={unlocked.size} max={total} tone="gb" />
        </section>
      ) : (
        <LcdPanel as="section" aria-labelledby="ach-signin">
          <h2 id="ach-signin" className="font-pixel text-sm leading-relaxed">
            PRESS START TO COLLECT
          </h2>
          <p className="mt-2 text-sm">
            Sign in and every cartridge, memory and wish you log can unlock a sticker.
          </p>
          <div className="mt-4">
            <PixelButton href="/login?next=%2Fachievements" variant="screen">
              Sign in
            </PixelButton>
          </div>
        </LcdPanel>
      )}

      <ul
        aria-label="Sticker sheet"
        className="border-border grid grid-cols-2 gap-3 rounded-sm border-4 border-dashed p-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {ACHIEVEMENTS.map((a) => (
          <li key={a.code}>
            <AchievementSticker
              achievement={a}
              unlockedAt={unlocked.get(a.code) ?? null}
              fresh={fresh.has(a.code)}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
