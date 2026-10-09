/** Same normalisation as public.f_search_norm in the database: lowercase, no accents. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function slugify(text: string): string {
  return normalize(text)
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "1998" / "May 1998" / "12 May 1998" depending on how precise the date is. */
export function formatReleaseDate(
  date: string | null,
  precision: 'day' | 'month' | 'year' | null,
): string {
  if (!date || !precision) return 'Unknown'
  const [y, m, d] = date.split('-').map(Number)
  if (precision === 'year') return String(y)
  const month = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-GB', {
    month: 'short',
    timeZone: 'UTC',
  })
  return precision === 'month' ? `${month} ${y}` : `${d} ${month} ${y}`
}
