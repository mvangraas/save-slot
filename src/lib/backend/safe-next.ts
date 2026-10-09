/** Only allow same-site relative redirects ("/collection"), never "//evil.com" or "https://…". */
export function safeNext(next: unknown, fallback = '/collection'): string {
  if (typeof next !== 'string') return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  if (/[\r\n]/.test(next)) return fallback
  return next.slice(0, 200)
}
