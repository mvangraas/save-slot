import type { Metadata } from 'next'
import Link from 'next/link'
import { ManualSection } from '@/components/retro/ManualSection'
import { readShopConfig } from '@/config/shop'
import { LEGAL_TITLES, type LegalDoc } from '@/content/legal'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach Save Slot about orders, repairs and the collector archive.',
}

export default function ContactPage() {
  const b = readShopConfig().business
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">CONTACT</h1>
      <ManualSection number={1} title="Get in touch">
        {b ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            <dt className="font-display text-xs uppercase">E-mail</dt>
            <dd>
              <a href={`mailto:${b.email}`} className="underline">
                {b.email}
              </a>
            </dd>
            {b.phone ? (
              <>
                <dt className="font-display text-xs uppercase">Phone</dt>
                <dd>
                  <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="underline">
                    {b.phone}
                  </a>
                </dd>
              </>
            ) : null}
            <dt className="font-display text-xs uppercase">Address</dt>
            <dd className="whitespace-pre-line">{b.address}</dd>
            <dt className="font-display text-xs uppercase">Business</dt>
            <dd>
              {b.legalName} · KvK {b.kvk}
              {b.vatId ? ` · VAT ${b.vatId}` : ''}
            </dd>
          </dl>
        ) : (
          <p>Our contact details will be published here soon.</p>
        )}
      </ManualSection>
      <ManualSection number={2} title="Quick links">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Link href="/repairs/status" className="underline">
              Track a repair
            </Link>{' '}
            with your repair number
          </li>
          <li>
            <Link href="/repairs#request" className="underline">
              Request a repair
            </Link>
          </li>
          {(Object.keys(LEGAL_TITLES) as LegalDoc[]).map((doc) => (
            <li key={doc}>
              <Link href={`/legal/${doc}`} className="underline">
                {LEGAL_TITLES[doc]}
              </Link>
            </li>
          ))}
        </ul>
      </ManualSection>
    </div>
  )
}
