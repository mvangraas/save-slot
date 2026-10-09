import type { Metadata } from 'next'
import { site } from '@/config/site'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-prose space-y-6 rounded-sm bg-paper p-6 text-ink sm:p-10">
      <h1 className="font-pixel text-base leading-relaxed">ABOUT SAVE SLOT</h1>
      <p>{site.description}</p>
      <section className="space-y-2">
        <h2 className="font-display text-sm uppercase">Disclaimer</h2>
        <p>{site.disclaimer}</p>
        <p>Save Slot does not host, link to or stream ROMs, and contains no emulator.</p>
      </section>
      <section className="space-y-2">
        <h2 className="font-display text-sm uppercase">Sources &amp; credits</h2>
        <p>
          Game data and images will be credited here per source once the catalogue is connected.
          Fonts: Press Start 2P, Silkscreen, IBM Plex Sans and IBM Plex Mono (SIL Open Font
          License).
        </p>
      </section>
    </article>
  )
}
