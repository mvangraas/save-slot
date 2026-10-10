import { XMLParser } from 'fast-xml-parser'

export type ParsedNewsItem = {
  title: string
  url: string
  excerpt: string | null
  publishedAt: string | null
}

export const EXCERPT_MAX = 200

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  // Feeds are untrusted input: no DOCTYPE entity expansion here; toPlainText decodes the
  // standard entities itself.
  processEntities: false,
  htmlEntities: false,
  ignoreDeclaration: true,
})

const ENTITY: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const code = e[1]?.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ' '
    }
    return ENTITY[e.toLowerCase()] ?? m
  })
}

const stripTags = (text: string) =>
  text.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ')

/** Plain text from feed content that may be HTML, or HTML escaped once more as text. */
export function toPlainText(value: unknown): string {
  const raw = (typeof value === 'string' ? value : textOf(value)).replace(/<!\[CDATA\[|\]\]>/g, '')
  return decodeEntities(stripTags(decodeEntities(stripTags(raw))))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function excerpt(text: string, max = EXCERPT_MAX): string | null {
  if (!text) return null
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s.,;:!?-]+$/, '')}…`
}

/** Only absolute http(s) links; anything else (javascript:, data:, relative) is dropped. */
export function safeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

function textOf(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (Array.isArray(v)) return textOf(v[0])
  if (typeof v === 'object' && '#text' in v) return textOf((v as Record<string, unknown>)['#text'])
  return ''
}

function isoDate(v: unknown): string | null {
  const s = textOf(v)
  if (!s) return null
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const asArray = <T>(v: T | T[] | undefined): T[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v]

function atomLink(link: unknown): string | null {
  for (const l of asArray(link as Record<string, unknown> | Record<string, unknown>[])) {
    if (typeof l === 'string') return safeUrl(l)
    const rel = l?.['@rel']
    if (!rel || rel === 'alternate') return safeUrl(l?.['@href'])
  }
  return null
}

/** Parses RSS 2.0 and Atom. Invalid or incomplete items are skipped, never thrown. */
export function parseFeed(xml: string): ParsedNewsItem[] {
  let doc: Record<string, unknown>
  try {
    doc = parser.parse(xml) as Record<string, unknown>
  } catch {
    return []
  }
  type Node = Record<string, unknown>
  const rss = doc.rss as Node | undefined
  const channel = (rss?.channel ?? (doc['rdf:RDF'] as Node | undefined)) as Node | undefined
  const out: ParsedNewsItem[] = []

  if (channel) {
    const items = asArray((channel.item ?? (doc['rdf:RDF'] as Node | undefined)?.item) as Node[])
    for (const it of items) {
      const title = toPlainText(it.title)
      const url = safeUrl(textOf(it.link)) ?? safeUrl(textOf(it.guid))
      if (!title || !url) continue
      const body = toPlainText(it.description ?? it['content:encoded'])
      out.push({
        title,
        url,
        excerpt: excerpt(body),
        publishedAt: isoDate(it.pubDate ?? it['dc:date']),
      })
    }
    return out
  }

  const feed = doc.feed as Node | undefined
  for (const e of asArray(feed?.entry as Node[])) {
    const title = toPlainText(e.title)
    const url = atomLink(e.link)
    if (!title || !url) continue
    out.push({
      title,
      url,
      excerpt: excerpt(toPlainText(e.summary ?? e.content)),
      publishedAt: isoDate(e.published ?? e.updated),
    })
  }
  return out
}

const GAME_BOY =
  /\bgame\s?boy\b|\bgameboy\b|\bgbc\b|\bgb studio\b|\bgame boy (colou?r|pocket|light)\b/i

/** True when the headline or excerpt is about Game Boy / Game Boy Color. */
export function isGameBoyRelated(item: Pick<ParsedNewsItem, 'title' | 'excerpt'>): boolean {
  return GAME_BOY.test(item.title) || GAME_BOY.test(item.excerpt ?? '')
}
