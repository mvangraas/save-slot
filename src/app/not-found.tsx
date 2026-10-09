import { ErrorState } from '@/components/retro/ErrorState'
import { PixelButton } from '@/components/retro/PixelButton'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-8">
      <ErrorState
        message={<p>This page doesn&apos;t exist.</p>}
        action={
          <PixelButton href="/" variant="screen">
            ▶ Yes
          </PixelButton>
        }
      />
    </div>
  )
}
