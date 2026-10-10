import { ErrorState } from '@/components/retro/ErrorState'
import { PixelButton } from '@/components/retro/PixelButton'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <ErrorState
        message={
          <>
            <p className="font-pixel text-xs leading-relaxed">ERROR 404</p>
            <p className="mt-2">
              This cartridge isn&apos;t in the archive. Check the slot and try again.
            </p>
          </>
        }
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <PixelButton href="/" variant="screen">
              ▶ Yes
            </PixelButton>
            <PixelButton href="/games" variant="screen">
              Browse games
            </PixelButton>
          </div>
        }
      />
    </div>
  )
}
