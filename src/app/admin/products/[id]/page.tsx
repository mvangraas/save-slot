import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { deleteProductAction } from '@/app/actions/admin'
import { ProductForm } from '@/components/admin/ProductForm'
import { ProductImages } from '@/components/admin/ProductImages'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { getShopStore, requireAdmin } from '@/lib/shop'

export const metadata = { title: 'Edit product' }

export default function EditProduct(props: PageProps<'/admin/products/[id]'>) {
  return (
    <Suspense fallback={<LoadingState />}>
      <Body {...props} />
    </Suspense>
  )
}

async function Body({ params }: PageProps<'/admin/products/[id]'>) {
  const { id } = await params
  await requireAdmin(`/admin/products/${id}`)
  const store = getShopStore()
  const [product, categories] = await Promise.all([
    store.getProductById(id),
    store.listCategories(),
  ])
  if (!product) notFound()
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-pixel text-lg">EDIT PRODUCT</h1>
        {product.active ? (
          <Link href={`/shop/${product.slug}`} className="text-sm underline">
            View in shop →
          </Link>
        ) : (
          <span className="text-sm text-fg-muted">Hidden from the shop</span>
        )}
      </div>
      <ProductForm product={product} categories={categories} />
      <ProductImages product={product} />
      <form action={deleteProductAction} className="border-t border-line pt-4">
        <input type="hidden" name="id" value={product.id} />
        <PixelButton type="submit" variant="secondary" className="bg-sticker-red text-white">
          Delete product
        </PixelButton>
        <p className="mt-2 text-xs text-fg-muted">
          Past orders keep their own copy of the name and price.
        </p>
      </form>
    </div>
  )
}
