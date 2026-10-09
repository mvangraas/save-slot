import Link from 'next/link'
import { cn } from '@/lib/cn'
import { hrefFor, serializeGameQuery } from '@/lib/catalog/params'
import type { GameQuery } from '@/lib/catalog/types'

type Props = {
  basePath: string
  query: GameQuery
  pageCount: number
  omitPlatform?: boolean
  extra?: Record<string, string>
}

function pagesToShow(current: number, count: number): (number | '…')[] {
  const set = new Set(
    [1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count),
  )
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export function Pagination({ basePath, query, pageCount, omitPlatform, extra }: Props) {
  if (pageCount <= 1) return null
  const href = (page: number) => {
    const p = serializeGameQuery({ ...query, page }, { omitPlatform })
    for (const [k, v] of Object.entries(extra ?? {})) p.set(k, v)
    return hrefFor(basePath, p)
  }
  const item = 'inline-flex min-h-11 min-w-11 items-center justify-center px-2 font-display text-sm'
  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1">
      {query.page > 1 ? (
        <Link href={href(query.page - 1)} className={cn(item, 'hover:bg-surface-2')} rel="prev">
          ◀ Prev
        </Link>
      ) : null}
      {pagesToShow(query.page, pageCount).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} aria-hidden className={cn(item, 'text-fg-muted')}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === query.page ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={cn(
              item,
              p === query.page ? 'bg-lcd-200 text-lcd-900' : 'hover:bg-surface-2',
            )}
          >
            {p}
          </Link>
        ),
      )}
      {query.page < pageCount ? (
        <Link href={href(query.page + 1)} className={cn(item, 'hover:bg-surface-2')} rel="next">
          Next ▶
        </Link>
      ) : null}
    </nav>
  )
}
