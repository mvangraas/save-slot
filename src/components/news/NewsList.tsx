import type { NewsItem } from '@/lib/news/store'
import { formatDate } from '@/lib/format'

/** Headlines link out to the original article; we only keep title, source, date and excerpt. */
export function NewsList({ items, compact = false }: { items: NewsItem[]; compact?: boolean }) {
  return (
    <ul className={compact ? 'grid gap-3 sm:grid-cols-3' : 'space-y-3'}>
      {items.map((item) => (
        <li key={item.id} className="rounded-sm bg-surface p-4">
          <article className="space-y-2">
            <p className="font-display text-xs text-fg-muted uppercase">
              {item.source.name}
              {item.publishedAt ? (
                <>
                  {' · '}
                  <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time>
                </>
              ) : null}
            </p>
            <h3 className="font-sans text-base leading-snug font-semibold">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="underline-offset-2 hover:underline"
              >
                {item.title}
                <span className="sr-only"> (opens {item.source.name} in a new tab)</span>
                <span aria-hidden> ↗</span>
              </a>
            </h3>
            {!compact && item.excerpt ? (
              <p className="text-sm text-fg-muted">{item.excerpt}</p>
            ) : null}
          </article>
        </li>
      ))}
    </ul>
  )
}
