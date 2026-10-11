import Link from 'next/link'
import { Suspense } from 'react'
import { CategoryForm } from '@/components/admin/CategoryForm'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { formatEuro } from '@/lib/format'
import { getShopStore, requireAdmin } from '@/lib/shop'

export const metadata = { title: 'Products' }

export default function AdminProducts() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Body />
    </Suspense>
  )
}

async function Body() {
  await requireAdmin('/admin/products')
  const store = getShopStore()
  const [{ items }, categories] = await Promise.all([
    store.listProducts({ sort: 'name', page: 1, pageSize: 500 }, { includeInactive: true }),
    store.listCategories(),
  ])
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-pixel text-lg">PRODUCTS</h1>
        <PixelButton href="/admin/products/new">New product</PixelButton>
      </div>
      {items.length === 0 ? (
        <p className="text-fg-muted">No products yet. Create your first one.</p>
      ) : (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable table">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <caption className="sr-only">All products</caption>
            <thead className="font-display text-xs uppercase">
              <tr className="border-b border-line">
                <th scope="col" className="py-2 pr-3">
                  Name
                </th>
                <th scope="col" className="py-2 pr-3">
                  Category
                </th>
                <th scope="col" className="py-2 pr-3">
                  Price
                </th>
                <th scope="col" className="py-2 pr-3">
                  Stock
                </th>
                <th scope="col" className="py-2">
                  Visible
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-line/50">
                  <td className="py-2 pr-3">
                    <Link href={`/admin/products/${p.id}`} className="underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{p.categoryName ?? '—'}</td>
                  <td className="py-2 pr-3 font-mono">{formatEuro(p.priceCents)}</td>
                  <td className="py-2 pr-3">{p.stock}</td>
                  <td className="py-2">{p.active ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section aria-labelledby="cat-title" className="space-y-3 bg-surface p-5">
        <h2 id="cat-title" className="font-display text-sm uppercase">
          Categories
        </h2>
        <p className="text-sm">
          {categories.length ? categories.map((c) => c.name).join(' · ') : 'None yet.'}
        </p>
        <CategoryForm />
      </section>
    </div>
  )
}
