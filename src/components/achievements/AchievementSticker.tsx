import type { AchievementDef } from '@/lib/achievements/definitions'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import { PixelIcon } from './PixelIcon'

type Props = {
  achievement: AchievementDef
  unlockedAt: string | null
  /** Highlights a freshly unlocked sticker with a short pop animation. */
  fresh?: boolean
  size?: 'md' | 'sm'
}

const tone = {
  gb: 'bg-lcd-200 text-lcd-900',
  gbc: 'bg-gbc-soft text-gbc-deep',
  any: 'bg-sticker text-ink',
}

/** One sticker on the sheet: full colour when unlocked, a grey "???" silhouette when not. */
export function AchievementSticker({
  achievement: a,
  unlockedAt,
  fresh = false,
  size = 'md',
}: Props) {
  const unlocked = unlockedAt !== null
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center gap-2 rounded-sm p-3 text-center',
        unlocked ? 'bg-surface' : 'bg-surface/60',
      )}
    >
      <div
        className={cn(
          'grid place-items-center notch-corners',
          size === 'md' ? 'size-20' : 'size-14',
          unlocked ? tone[a.platform ?? 'any'] : 'bg-shell-600 text-shell-300',
          unlocked && '-rotate-2',
          fresh && 'animate-sticker-pop',
        )}
      >
        {unlocked ? (
          <PixelIcon icon={a.icon} className={size === 'md' ? 'size-10' : 'size-7'} />
        ) : (
          <span aria-hidden className="font-pixel text-base">
            ?
          </span>
        )}
      </div>
      <p className={cn('font-display text-sm uppercase', !unlocked && 'text-fg-muted')}>
        {unlocked ? (
          a.name
        ) : (
          <>
            <span aria-hidden>???</span>
            <span className="sr-only">Locked achievement</span>
          </>
        )}
      </p>
      {size === 'md' ? (
        <p className="text-xs text-fg-muted">
          {unlocked ? a.description : <>Hint: {a.description}</>}
        </p>
      ) : null}
      {unlocked && size === 'md' ? (
        <p className="mt-auto font-mono text-[0.6875rem] text-fg-muted">
          <span className="sr-only">Unlocked on </span>
          {formatDate(unlockedAt)}
        </p>
      ) : null}
    </div>
  )
}
