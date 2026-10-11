'use server'

import { refresh, updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { fieldErrors, idSchema, type FormState } from '@/lib/backend/schemas'
import { processPhoto } from '@/lib/photos/process'
import { getShopStore, requireAdmin } from '@/lib/shop'
import {
  categoryFormSchema,
  orderStatusSchema,
  productFormSchema,
  repairPriceSchema,
  repairStatusSchema,
} from '@/lib/shop/schemas'
import { priceSchema } from '@/lib/backend/schemas'

// Every action re-checks admin rights on the server: hiding buttons is not security.

export async function saveProductAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin('/admin/products')
  const id = form.get('id') ? idSchema.safeParse(form.get('id')) : null
  if (id && !id.success) return { message: 'Unknown product.' }
  const parsed = productFormSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const { price, ...rest } = parsed.data
  const res = await getShopStore().saveProduct(id?.data ?? null, { ...rest, priceCents: price! })
  if (!res.ok) return { errors: { slug: res.error } }
  updateTag('shop')
  if (!id) redirect(`/admin/products/${res.data.id}?created=1`)
  refresh()
  return { ok: true, message: 'PRODUCT SAVED' }
}

export async function deleteProductAction(form: FormData): Promise<void> {
  await requireAdmin('/admin/products')
  const id = idSchema.safeParse(form.get('id'))
  if (id.success) await getShopStore().deleteProduct(id.data)
  updateTag('shop')
  redirect('/admin/products')
}

export async function saveCategoryAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin('/admin/products')
  const parsed = categoryFormSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const res = await getShopStore().saveCategory(parsed.data)
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'CATEGORY SAVED' }
}

export async function addProductImageAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin('/admin/products')
  const id = idSchema.safeParse(form.get('productId'))
  const file = form.get('image')
  if (!id.success) return { message: 'Unknown product.' }
  if (!(file instanceof File)) return { errors: { image: 'Choose an image.' } }
  const processed = await processPhoto(file)
  if (!processed.ok) return { errors: { image: processed.error } }
  const alt =
    String(form.get('alt') ?? '')
      .trim()
      .slice(0, 200) || null
  const res = await getShopStore().addProductImage(id.data, processed.photo, alt)
  if (!res.ok) return { message: res.error }
  updateTag('shop')
  refresh()
  return { ok: true, message: 'IMAGE ADDED' }
}

export async function removeProductImageAction(form: FormData): Promise<void> {
  await requireAdmin('/admin/products')
  const id = idSchema.safeParse(form.get('imageId'))
  if (id.success) await getShopStore().removeProductImage(id.data)
  refresh()
}

export async function setOrderStatusAction(form: FormData): Promise<void> {
  await requireAdmin('/admin/orders')
  const id = idSchema.safeParse(form.get('id'))
  const status = orderStatusSchema.safeParse(form.get('status'))
  if (!id.success || !status.success) return
  // "Paid" only ever comes from Mollie, never from a manual change.
  if (status.data === 'paid' || status.data === 'pending_payment') return
  await getShopStore().setOrderStatus(id.data, status.data)
  refresh()
}

export async function setRepairStatusAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin('/admin/repairs')
  const id = idSchema.safeParse(form.get('id'))
  const status = repairStatusSchema.safeParse(form.get('status'))
  if (!id.success || !status.success) return { message: 'Choose a status.' }
  const note =
    String(form.get('note') ?? '')
      .trim()
      .slice(0, 1000) || null
  const res = await getShopStore().updateRepairStatus(id.data, status.data, note)
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'STATUS UPDATED' }
}

export async function setRepairFinalPriceAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin('/admin/repairs')
  const id = idSchema.safeParse(form.get('id'))
  const price = priceSchema.safeParse(form.get('finalPrice'))
  if (!id.success) return { message: 'Unknown repair.' }
  if (!price.success) return { errors: fieldErrors(price.error) }
  const res = await getShopStore().setRepairFinalPrice(id.data, price.data)
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'PRICE SAVED' }
}

export async function addRepairNoteAction(_prev: FormState, form: FormData): Promise<FormState> {
  const admin = await requireAdmin('/admin/repairs')
  const id = idSchema.safeParse(form.get('id'))
  const body = String(form.get('body') ?? '').trim()
  if (!id.success) return { message: 'Unknown repair.' }
  if (body.length < 1 || body.length > 3000) return { errors: { body: 'Write a note (max 3000).' } }
  const res = await getShopStore().addRepairNote(id.data, body, admin.email)
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'NOTE ADDED' }
}

export async function setRepairPriceAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin('/admin/repair-prices')
  const parsed = repairPriceSchema.safeParse(Object.fromEntries(form))
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  const v = parsed.data
  const res = await getShopStore().setRepairPrice({
    deviceId: v.deviceId,
    issueId: v.issueId,
    priceFromCents: v.priceFrom,
    priceToCents: v.priceTo,
    daysMin: v.daysMin,
    daysMax: v.daysMax,
  })
  if (!res.ok) return { message: res.error }
  refresh()
  return { ok: true, message: 'SAVED' }
}
