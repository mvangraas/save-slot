import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LegalText } from '@/components/legal/LegalText'
import { readShopConfig } from '@/config/shop'
import { LEGAL_TITLES, type LegalDoc } from '@/content/legal'
import { legalText } from '@/lib/shop/availability'

const DOCS = Object.keys(LEGAL_TITLES) as LegalDoc[]
const isDoc = (v: string): v is LegalDoc => (DOCS as string[]).includes(v)

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }))
}

export async function generateMetadata({ params }: PageProps<'/legal/[doc]'>): Promise<Metadata> {
  const { doc } = await params
  return isDoc(doc) ? { title: LEGAL_TITLES[doc] } : { title: 'Not found' }
}

export default async function LegalPage({ params }: PageProps<'/legal/[doc]'>) {
  const { doc } = await params
  if (!isDoc(doc)) notFound()
  const text = legalText(doc)
  const b = readShopConfig().business
  return (
    <article className="mx-auto max-w-prose space-y-6 rounded-sm bg-paper p-6 text-ink sm:p-10">
      <h1 className="font-pixel text-base leading-relaxed">{LEGAL_TITLES[doc].toUpperCase()}</h1>
      {text ? (
        <>
          <LegalText text={text} />
          {b ? (
            <p className="border-t border-ink/20 pt-4 text-sm">
              {b.legalName} · KvK {b.kvk}
              {b.vatId ? ` · VAT ${b.vatId}` : ''} · {b.email}
            </p>
          ) : null}
        </>
      ) : (
        <p>
          This document has not been published yet. Ordering and repair requests stay closed until
          it is.
        </p>
      )}
    </article>
  )
}
