import { Suspense } from 'react'
import { ProductForm } from '@/components/admin/ProductForm'
import { LoadingState } from '@/components/retro/LoadingState'
import { getShopStore, requireAdmin } from '@/lib/shop'

export const metadata = { title: 'New product' }

export default function NewProduct() {
  return (
    <Suspense fallback={<LoadingState />}>
      <Body />
    </Suspense>
  )
}

async function Body() {
  await requireAdmin('/admin/products/new')
  const categories = await getShopStore().listCategories()
  return (
    <div className="space-y-6">
      <h1 className="font-pixel text-lg">NEW PRODUCT</h1>
      <p className="text-sm text-fg-muted">
        New products start hidden. Add photos after saving, then tick “Visible in the shop”.
      </p>
      <ProductForm categories={categories} />
    </div>
  )
}
