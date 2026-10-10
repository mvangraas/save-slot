import Link from 'next/link'
import { getLatestNews } from '@/lib/news'
import { NewsList } from './NewsList'

/** Homepage strip. Renders nothing when there is no Game Boy news to report. */
export async function LatestNews() {
  const items = await getLatestNews(3)
  if (items.length === 0) return null
  return (
    <section aria-labelledby="news-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="news-title" className="font-pixel text-sm leading-relaxed">
          LATEST NEWS
        </h2>
        <Link href="/news" className="font-display text-xs text-fg-muted uppercase hover:text-fg">
          All news →
        </Link>
      </div>
      <NewsList items={items} compact />
    </section>
  )
}
