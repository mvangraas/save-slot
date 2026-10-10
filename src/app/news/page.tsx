import type { Metadata } from 'next'
import { Suspense } from 'react'
import { NewsList } from '@/components/news/NewsList'
import { EmptyState } from '@/components/retro/EmptyState'
import { LoadingState } from '@/components/retro/LoadingState'
import { NEWS_SOURCES } from '@/config/news-sources'
import { getLatestNews } from '@/lib/news'

export const metadata: Metadata = {
  title: 'News',
  description: 'Game Boy and Game Boy Color news from retro gaming sites, linked to the source.',
}

export default function NewsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">NEWS</h1>
        <p className="mt-2 max-w-prose text-fg-muted">
          Game Boy headlines from retro gaming sites. We only show the headline and a short snippet;
          every story opens on the original site.
        </p>
      </header>
      <Suspense fallback={<LoadingState label="Tuning in" />}>
        <NewsBody />
      </Suspense>
      <p className="text-xs text-fg-muted">
        Sources:{' '}
        {NEWS_SOURCES.filter((s) => s.enabled).map((s, i, all) => (
          <span key={s.slug}>
            <a href={s.siteUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {s.name}
            </a>
            {i < all.length - 1 ? ', ' : ''}
          </span>
        ))}
        . Only items about Game Boy or Game Boy Color are shown.
      </p>
    </div>
  )
}

async function NewsBody() {
  const items = await getLatestNews(30)
  if (items.length === 0) {
    return (
      <EmptyState
        title="NO SIGNAL"
        description={<p>No Game Boy news right now. Check back later.</p>}
      />
    )
  }
  return <NewsList items={items} />
}
