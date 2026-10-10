export function formatEuro(cents: number | null | undefined): string | null {
  return cents == null
    ? null
    : new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

/** "10 Oct 2026" — UTC so server and client render the same string. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
}
