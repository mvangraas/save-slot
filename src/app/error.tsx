'use client'

import { ErrorState } from '@/components/retro/ErrorState'
import { PixelButton } from '@/components/retro/PixelButton'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <ErrorState
        message={
          <>
            <p className="font-pixel text-xs leading-relaxed">ERROR 500</p>
            <p className="mt-2">Something went wrong while loading this screen.</p>
            {error.digest ? (
              <p className="mt-2 font-mono text-xs">Error code: {error.digest}</p>
            ) : null}
          </>
        }
        action={
          <PixelButton onClick={() => reset()} variant="screen">
            ▶ Yes
          </PixelButton>
        }
      />
    </div>
  )
}
