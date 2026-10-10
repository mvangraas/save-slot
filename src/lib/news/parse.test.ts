import { describe, expect, it } from 'vitest'
import { excerpt, isGameBoyRelated, parseFeed, safeUrl, toPlainText } from './parse'

const rss = `<?xml version="1.0"?>
<!DOCTYPE rss [<!ENTITY boom "BOOM">]>
<rss version="2.0"><channel><title>t</title>
<item><title>Game Boy &amp; friends</title><link>https://example.com/a</link>
<description><![CDATA[<p>Hello <b>world</b> &hellip; <script>alert(1)</script></p>]]></description>
<pubDate>Fri, 09 Oct 2026 10:00:00 GMT</pubDate></item>
<item><title>No link</title></item>
<item><title>Bad link</title><link>javascript:alert(1)</link></item>
<item><title>&boom;</title><link>https://example.com/b</link></item>
</channel></rss>`

const atom = `<feed xmlns="http://www.w3.org/2005/Atom">
<entry><title type="html">GBC &lt;b&gt;news&lt;/b&gt;</title>
<link rel="self" href="https://example.com/self"/><link rel="alternate" href="https://example.com/post"/>
<updated>2026-10-01T00:00:00Z</updated><content type="html">&lt;p&gt;Body&lt;/p&gt;</content></entry>
</feed>`

describe('parseFeed', () => {
  it('parses RSS 2.0, strips HTML and skips items without a safe link', () => {
    const items = parseFeed(rss)
    expect(items.map((i) => i.title)).toEqual(['Game Boy & friends', '&boom;'])
    expect(items[0]).toEqual({
      title: 'Game Boy & friends',
      url: 'https://example.com/a',
      excerpt: 'Hello world …',
      publishedAt: '2026-10-09T10:00:00.000Z',
    })
  })

  it('never expands DOCTYPE entities', () => {
    expect(parseFeed(rss).some((i) => i.title.includes('BOOM'))).toBe(false)
  })

  it('parses Atom and prefers the alternate link', () => {
    expect(parseFeed(atom)).toEqual([
      {
        title: 'GBC news',
        url: 'https://example.com/post',
        excerpt: 'Body',
        publishedAt: '2026-10-01T00:00:00.000Z',
      },
    ])
  })

  it('returns [] for garbage', () => {
    expect(parseFeed('not xml at all <<<')).toEqual([])
    expect(parseFeed('')).toEqual([])
  })
})

describe('helpers', () => {
  it('excerpt stays within 200 characters and ends on a word', () => {
    const long = 'word '.repeat(100).trim()
    const e = excerpt(long)!
    expect(e.length).toBeLessThanOrEqual(200)
    expect(e.endsWith('word…')).toBe(true)
    expect(excerpt('short')).toBe('short')
    expect(excerpt('')).toBeNull()
  })

  it('decodes numeric entities and drops tags', () => {
    expect(toPlainText('<i>Pok&#233;mon</i> &#x2014; Red')).toBe('Pokémon — Red')
  })

  it('only accepts http(s) URLs', () => {
    expect(safeUrl('https://a.b/c')).toBe('https://a.b/c')
    expect(safeUrl('data:text/html,hi')).toBeNull()
    expect(safeUrl('/relative')).toBeNull()
  })

  it('recognises Game Boy news', () => {
    expect(isGameBoyRelated({ title: 'New GameBoy shell', excerpt: null })).toBe(true)
    expect(isGameBoyRelated({ title: 'Mods', excerpt: 'for the Game Boy Pocket' })).toBe(true)
    expect(isGameBoyRelated({ title: 'GBC jam', excerpt: null })).toBe(true)
    expect(isGameBoyRelated({ title: 'A new Mega Drive mini', excerpt: 'Big news' })).toBe(false)
  })
})
