import { EmptyState } from '@/components/retro/EmptyState'
import { PixelButton } from '@/components/retro/PixelButton'
import type { Platform } from '@/lib/types'

export function ComingSoon({
  title,
  phase,
  tone = 'gb',
}: {
  title: string
  phase: number
  tone?: Platform
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">{title}</h1>
      <EmptyState
        tone={tone}
        title="NO DATA ON THIS SAVE FILE… YET"
        description={<p>This screen unlocks in phase {phase} of the build.</p>}
        action={
          <PixelButton href="/" variant="secondary">
            Back to start
          </PixelButton>
        }
      />
    </div>
  )
}
