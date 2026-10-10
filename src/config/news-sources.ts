/**
 * RSS sources for /news. Only headline, link, source, date and a ≤200-character excerpt
 * are stored — never full articles. Items link out to the original site.
 *
 * `relevance`:
 * - 'all'      every item counts (the site is entirely about Game Boy).
 * - 'gameboy'  only items that actually mention Game Boy / GBC are kept, so the page only
 *              shows news when a site has something to say about our platforms.
 */
export type NewsSourceConfig = {
  slug: string
  name: string
  siteUrl: string
  feedUrl: string
  relevance: 'all' | 'gameboy'
  enabled: boolean
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  {
    slug: 'time-extension',
    name: 'Time Extension',
    siteUrl: 'https://www.timeextension.com',
    feedUrl: 'https://www.timeextension.com/feeds/latest',
    relevance: 'gameboy',
    enabled: true,
  },
  {
    slug: 'retrorgb',
    name: 'RetroRGB',
    siteUrl: 'https://www.retrorgb.com',
    feedUrl: 'https://www.retrorgb.com/feed',
    relevance: 'gameboy',
    enabled: true,
  },
  {
    slug: 'retro-gamer',
    name: 'Retro Gamer',
    siteUrl: 'https://www.retrogamer.net',
    feedUrl: 'https://www.retrogamer.net/feed/',
    relevance: 'gameboy',
    enabled: true,
  },
  {
    slug: 'gb-studio-central',
    name: 'GB Studio Central',
    siteUrl: 'https://gbstudiocentral.com',
    feedUrl: 'https://gbstudiocentral.com/feed/',
    relevance: 'all',
    enabled: true,
  },
]
