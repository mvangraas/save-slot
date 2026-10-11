'use client'

import { addProductImageAction, removeProductImageAction } from '@/app/actions/admin'
import { FormMessage, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PixelButton } from '@/components/retro/PixelButton'
import { formDataWithShrunkImages } from '@/lib/photos/shrink'
import type { Product } from '@/lib/shop/types'

export function ProductImages({ product }: { product: Product }) {
  const { state, pending, formProps } = useForm(addProductImageAction, {
    prepare: (form) => formDataWithShrunkImages(form, 'image'),
  })
  return (
    <section aria-labelledby="images-title" className="space-y-3 bg-surface p-5">
      <h2 id="images-title" className="font-display text-sm uppercase">
        Photos ({product.images.length}/8)
      </h2>
      {product.images.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {product.images.map((img, i) => (
            <li key={img.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
              <img
                src={img.url}
                alt={img.alt ?? `Photo ${i + 1}`}
                className="size-24 object-cover"
              />
              <form action={removeProductImageAction}>
                <input type="hidden" name="imageId" value={img.id} />
                <button type="submit" className="min-h-9 font-display text-xs uppercase underline">
                  Remove<span className="sr-only"> photo {i + 1}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-fg-muted">No photos yet. The shop shows a placeholder.</p>
      )}
      {product.images.length < 8 ? (
        <form {...formProps} className="flex flex-wrap items-end gap-3" noValidate>
          <input type="hidden" name="productId" value={product.id} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase">Add photo</span>
            <input
              type="file"
              name="image"
              accept="image/jpeg,image/png,image/webp"
              className="text-sm"
            />
          </label>
          <TextField label="Alt text" name="alt" placeholder="What the photo shows" />
          <PixelButton type="submit" size="sm" variant="secondary" disabled={pending}>
            {pending ? 'Uploading…' : 'Upload'}
          </PixelButton>
          {state.errors?.image ? (
            <p role="alert" className="w-full bg-sticker-red px-3 py-2 text-sm text-white">
              {state.errors.image}
            </p>
          ) : null}
          <FormMessage ok={state.ok} message={state.message} />
        </form>
      ) : null}
    </section>
  )
}
