import Link from 'next/link'
import { PlatformBadge } from '@/components/retro/PlatformBadge'
import { RegionTag } from '@/components/retro/RegionTag'
import { Sticker } from '@/components/retro/Sticker'
import type { GameSummary } from '@/lib/catalog/types'

/** Compact "archive index" view. */
export function GameList({ items }: { items: GameSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-sm bg-surface">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">Games</caption>
        <thead>
          <tr className="border-b-2 border-line font-display text-xs text-fg-muted uppercase">
            <th scope="col" className="px-3 py-2">
              Title
            </th>
            <th scope="col" className="px-3 py-2">
              Platform
            </th>
            <th scope="col" className="px-3 py-2">
              Year
            </th>
            <th scope="col" className="px-3 py-2">
              Regions
            </th>
            <th scope="col" className="hidden px-3 py-2 md:table-cell">
              Developer
            </th>
            <th scope="col" className="hidden px-3 py-2 lg:table-cell">
              Genre
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((g) => (
            <tr key={g.id} className="border-b border-line/50 last:border-0 hover:bg-surface-2">
              <th scope="row" className="px-3 py-2 font-medium">
                <Link href={`/games/${g.slug}`} className="hover:underline">
                  {g.title}
                </Link>
                {g.owned ? <Sticker kind="owned" className="ml-2" /> : null}
              </th>
              <td className="px-3 py-2">
                <PlatformBadge platform={g.platform} />
              </td>
              <td className="px-3 py-2 font-mono">{g.firstReleaseYear ?? '—'}</td>
              <td className="px-3 py-2">
                <span className="flex gap-1">
                  {g.regions.map((r) => (
                    <RegionTag key={r} region={r} />
                  ))}
                </span>
              </td>
              <td className="hidden px-3 py-2 text-fg-muted md:table-cell">
                {g.developerName ?? '—'}
              </td>
              <td className="hidden px-3 py-2 text-fg-muted lg:table-cell">
                {g.genreNames.join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
