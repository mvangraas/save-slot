/**
 * Legal texts for the shop and repair service, written and owned by the business owner.
 *
 * Fill these in yourself (or have them written for you) before opening the shop. Use plain text:
 * blank lines separate paragraphs, lines starting with "# " become headings.
 * While a text is null, its page says "not published yet" and the parts that depend on it
 * (checkout, repair requests) stay closed. Save Slot never invents legal claims.
 */
export type LegalDoc = 'terms' | 'privacy' | 'shipping-returns' | 'warranty'

export const LEGAL_TEXTS: Record<LegalDoc, string | null> = {
  terms: null,
  privacy: null,
  'shipping-returns': null,
  warranty: null,
}

export const LEGAL_TITLES: Record<LegalDoc, string> = {
  terms: 'Terms and conditions',
  privacy: 'Privacy statement',
  'shipping-returns': 'Shipping and returns',
  warranty: 'Warranty',
}
