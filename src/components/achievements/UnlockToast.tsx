'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { IconKey } from '@/lib/achievements/definitions'
import { cn } from '@/lib/cn'
import { playSound } from '@/lib/sound'
import type { Platform } from '@/lib/types'
import { PixelIcon } from './PixelIcon'

type Unlock = { code: string; name: string; icon: IconKey; platform: Platform | null }

/** Codes already announced in this tab, so a re-render never repeats a toast. */
const announced = new Set<string>()

const tone = {
  gb: 'bg-lcd-200 text-lcd-900',
  gbc: 'bg-gbc-soft text-gbc-deep',
  any: 'bg-sticker text-ink',
}

export function UnlockToast({ unlocked, cookieName }: { unlocked: Unlock[]; cookieName: string }) {
  const [queue, setQueue] = useState<Unlock[]>([])

  useEffect(() => {
    if (unlocked.length === 0) return
    document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`
    const fresh = unlocked.filter((u) => !announced.has(u.code))
    if (fresh.length === 0) return
    fresh.forEach((u) => announced.add(u.code))
    // Syncing external state (a one-shot cookie) into the toast queue.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueue((q) => [...q, ...fresh])
    playSound('unlock')
  }, [unlocked, cookieName])

  useEffect(() => {
    if (queue.length === 0) return
    const timer = setTimeout(() => setQueue((q) => q.slice(1)), 6000)
    return () => clearTimeout(timer)
  }, [queue])

  const visible = queue.slice(-3)
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {visible.map((u) => (
        <div
          key={u.code}
          className="pointer-events-auto flex w-full max-w-sm animate-toast-in items-center gap-3 border-4 border-shell-950 bg-lcd-200 p-3 text-lcd-900 shadow-[4px_4px_0_0_rgb(0_0_0/0.45)]"
        >
          <span
            className={cn(
              'grid size-12 shrink-0 animate-sticker-pop place-items-center notch-corners',
              tone[u.platform ?? 'any'],
            )}
          >
            <PixelIcon icon={u.icon} className="size-7" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-pixel text-[0.625rem] leading-relaxed">ACHIEVEMENT UNLOCKED</p>
            <p className="truncate font-display text-base uppercase">{u.name}</p>
            <Link href="/achievements" className="text-xs underline">
              View sticker sheet
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setQueue((q) => q.filter((x) => x.code !== u.code))}
            className="grid size-11 shrink-0 place-items-center font-pixel text-xs"
            aria-label={`Dismiss ${u.name}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
