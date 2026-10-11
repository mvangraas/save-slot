import type { Metadata } from 'next'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { PixelButton } from '@/components/retro/PixelButton'

export const metadata: Metadata = { title: 'Account deleted', robots: { index: false } }

export default function AccountDeletedPage() {
  return (
    <div className="mx-auto max-w-xl py-8">
      <LcdPanel as="section" aria-labelledby="deleted-title" screenClassName="text-center">
        <h1 id="deleted-title" className="font-pixel text-base leading-relaxed">
          SAVE FILE ERASED
        </h1>
        <p className="mt-3 text-sm">
          Your account, collection, wishlist, memories, photos and achievements have been
          permanently deleted. Thanks for playing.
        </p>
        <div className="mt-5">
          <PixelButton href="/" variant="screen">
            ▶ Back to the title screen
          </PixelButton>
        </div>
      </LcdPanel>
    </div>
  )
}
