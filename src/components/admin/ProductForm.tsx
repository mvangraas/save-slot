'use client'

import { saveProductAction } from '@/app/actions/admin'
import { Field, FormMessage, inputCls, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PixelButton } from '@/components/retro/PixelButton'
import {
  PRODUCT_CONDITIONS,
  productConditionLabel,
  type Category,
  type Product,
} from '@/lib/shop/types'

export function ProductForm({
  product,
  categories,
}: {
  product?: Product
  categories: Category[]
}) {
  const { state, pending, formProps } = useForm(saveProductAction)
  const e = state.errors ?? {}
  return (
    <form {...formProps} className="space-y-4 bg-surface p-5" noValidate>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" name="name" defaultValue={product?.name} error={e.name} />
        <TextField
          label="URL slug"
          name="slug"
          defaultValue={product?.slug}
          hint="Lowercase, dashes: becomes /shop/your-slug"
          error={e.slug}
        />
        <TextField
          label="Price (€, incl. VAT where applicable)"
          name="price"
          inputMode="decimal"
          defaultValue={product ? (product.priceCents / 100).toFixed(2) : ''}
          error={e.price}
        />
        <TextField
          label="Stock"
          name="stock"
          type="number"
          min={0}
          defaultValue={product?.stock ?? 0}
          error={e.stock}
        />
        <Field label="Category" error={e.categoryId}>
          {(a11y) => (
            <select
              {...a11y}
              name="categoryId"
              defaultValue={product?.categoryId ?? ''}
              className={inputCls}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Condition" error={e.condition}>
          {(a11y) => (
            <select
              {...a11y}
              name="condition"
              defaultValue={product?.condition ?? 'used'}
              className={inputCls}
            >
              {PRODUCT_CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {productConditionLabel[c]}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <Field label="Description" error={e.description}>
        {(a11y) => (
          <textarea
            {...a11y}
            name="description"
            rows={6}
            maxLength={5000}
            defaultValue={product?.description}
            className={`${inputCls} py-2`}
          />
        )}
      </Field>
      <Field
        label="Specifications"
        hint="One per line as “Label: value”, e.g. “Region: PAL”."
        error={e.specs}
      >
        {(a11y) => (
          <textarea
            {...a11y}
            name="specs"
            rows={4}
            defaultValue={product?.specs.map((s) => `${s.label}: ${s.value}`).join('\n')}
            className={`${inputCls} py-2 font-mono text-sm`}
          />
        )}
      </Field>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="active"
          defaultChecked={product?.active ?? false}
          className="size-5"
        />
        Visible in the shop
      </label>
      <PixelButton type="submit" disabled={pending}>
        {pending ? 'Saving…' : product ? 'Save product' : 'Create product'}
      </PixelButton>
      <FormMessage ok={state.ok} message={state.message} />
    </form>
  )
}
