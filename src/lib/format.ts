export function formatEuro(cents: number | null | undefined): string | null {
  return cents == null
    ? null
    : new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}
