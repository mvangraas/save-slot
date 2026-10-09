'use client'

import { ErrorState } from '@/components/retro/ErrorState'
import { PixelButton } from '@/components/retro/PixelButton'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <ErrorState
        message={<p>Something went wrong while loading this screen.</p>}
        action={
          <PixelButton onClick={() => reset()} variant="screen">
            ▶ Yes
          </PixelButton>
        }
      />
    </div>
  )
}
