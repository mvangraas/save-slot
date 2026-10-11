import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { LoadingState } from '@/components/retro/LoadingState'
import { requireAdmin } from '@/lib/shop'

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Admin' },
  robots: { index: false },
}

const LINKS = [
  ['/admin', 'Dashboard'],
  ['/admin/products', 'Products'],
  ['/admin/orders', 'Orders'],
  ['/admin/repairs', 'Repairs'],
  ['/admin/repair-prices', 'Repair prices'],
] as const

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-shell-950 pb-3">
        <p className="font-pixel text-xs">ADMIN</p>
        <nav aria-label="Admin" className="flex flex-wrap gap-1">
          {LINKS.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center bg-surface-2 px-3 font-display text-xs uppercase hover:bg-surface"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <Suspense fallback={<LoadingState />}>
        <Gate>{children}</Gate>
      </Suspense>
    </div>
  )
}

/** Server-side check before anything in /admin renders (each action checks again). */
async function Gate({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return <>{children}</>
}
