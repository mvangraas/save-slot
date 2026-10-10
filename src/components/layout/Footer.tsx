import Link from 'next/link'
import { site } from '@/config/site'
import { EffectsToggle } from './EffectsToggle'
import { SoundToggle } from './SoundToggle'

export function Footer() {
  return (
    <footer className="mt-16 border-t-4 border-shell-950 bg-surface pb-24 lg:pb-8">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 pt-8 text-sm text-fg-muted sm:grid-cols-[1fr_auto]">
        <div className="space-y-3">
          <p className="font-pixel text-[0.625rem] text-fg">SAVE SLOT</p>
          <p className="max-w-prose">{site.disclaimer}</p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <EffectsToggle />
          <SoundToggle />
          <Link href="/news" className="inline-flex min-h-11 items-center hover:text-fg">
            News
          </Link>
          <Link href="/about" className="inline-flex min-h-11 items-center hover:text-fg">
            About &amp; sources
          </Link>
        </div>
      </div>
    </footer>
  )
}
