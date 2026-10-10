import type { Metadata } from 'next'
import { NEWS_SOURCES } from '@/config/news-sources'
import { site } from '@/config/site'
import { getSourceCounts } from '@/lib/catalog'

export const metadata: Metadata = {
  title: 'About & sources',
  description: 'What Save Slot is, where its data comes from and who to credit.',
}

const ext = { target: '_blank', rel: 'noopener noreferrer', className: 'underline' } as const

export default async function AboutPage() {
  const counts = await getSourceCounts()
  const n = (v: number | undefined) => (v ?? 0).toLocaleString('en-GB')

  return (
    <article className="mx-auto max-w-prose space-y-8 rounded-sm bg-paper p-6 text-ink sm:p-10">
      <h1 className="font-pixel text-base leading-relaxed">ABOUT SAVE SLOT</h1>
      <p>{site.description}</p>

      <section className="space-y-2" aria-labelledby="disclaimer">
        <h2 id="disclaimer" className="font-display text-sm uppercase">
          Disclaimer
        </h2>
        <p>{site.disclaimer}</p>
        <p>Save Slot does not host, link to or stream ROMs, and contains no emulator.</p>
      </section>

      <section className="space-y-4" aria-labelledby="sources">
        <h2 id="sources" className="font-display text-sm uppercase">
          Sources &amp; credits
        </h2>

        <div className="space-y-1">
          <h3 className="font-semibold">Game catalogue</h3>
          <ul className="list-disc space-y-1 pl-5">
            {counts.games.seed ? (
              <li>
                {n(counts.games.seed)} games from the Save Slot starter archive: hand-checked facts
                only (titles, years, regions, companies). Descriptions are written for Save Slot.
              </li>
            ) : null}
            {counts.games.igdb || counts.media.igdb ? (
              <li>
                {n(counts.games.igdb)} games and {n(counts.media.igdb)} cover images via{' '}
                <a href="https://www.igdb.com" {...ext}>
                  IGDB.com
                </a>
                , used under the IGDB API terms. Every image shows its credit.
              </li>
            ) : (
              <li>
                External catalogues (IGDB) are prepared but not switched on yet. Until then there
                are no box art images: we only show artwork from sources that allow it.
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold">Prices</h3>
          <ul className="list-disc space-y-1 pl-5">
            {counts.prices.pricecharting ? (
              <li>
                {n(counts.prices.pricecharting)} price points from{' '}
                <a href="https://www.pricecharting.com" {...ext}>
                  PriceCharting
                </a>
                . Always an estimate, never a quote, shown with source and date. Converted from USD
                for display only.
              </li>
            ) : null}
            {counts.prices.seed ? (
              <li>
                Demo prices: generated placeholder values so the value features can be tried out.
                They are labelled as demo data everywhere and are not market prices.
              </li>
            ) : null}
            {counts.prices.manual ? <li>Some prices were entered manually by the admin.</li> : null}
          </ul>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold">News</h3>
          <p>
            Headlines, a short snippet (max. 200 characters) and a link back to the original article
            from:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {NEWS_SOURCES.filter((s) => s.enabled).map((s) => (
              <li key={s.slug}>
                <a href={s.siteUrl} {...ext}>
                  {s.name}
                </a>
                {s.relevance === 'gameboy' ? ' (only Game Boy-related stories)' : null}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold">Type &amp; artwork</h3>
          <p>
            Fonts: Press Start 2P, Silkscreen, IBM Plex Sans and IBM Plex Mono (SIL Open Font
            License). Cartridge placeholders, sticker icons and sounds are original to Save Slot.
          </p>
        </div>
      </section>
    </article>
  )
}
