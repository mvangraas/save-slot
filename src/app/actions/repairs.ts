'use server'

import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/backend'
import { clientIp } from '@/lib/backend/client-ip'
import { fieldErrors, type FormState } from '@/lib/backend/schemas'
import { processPhoto } from '@/lib/photos/process'
import { createLimiter } from '@/lib/rate-limit'
import { getShopStore } from '@/lib/shop'
import { repairAvailability } from '@/lib/shop/availability'
import { repairLookupSchema, repairSchema } from '@/lib/shop/schemas'
import type { Photo, RepairEvent, RepairRequest } from '@/lib/shop/types'
import { isReference, newAccessToken } from '@/lib/shop/util'

const MAX_REPAIR_PHOTOS = 4
const e2e = process.env.E2E === '1'
const submitLimiter = createLimiter({ limit: e2e ? 1000 : 5, windowMs: 60 * 60_000 })
const lookupLimiter = createLimiter({ limit: e2e ? 1000 : 20, windowMs: 10 * 60_000 })

export async function submitRepairAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (!repairAvailability().open) {
    return { message: 'Repair requests are not open yet.' }
  }
  if (!submitLimiter.hit(`repair:${await clientIp()}`)) {
    return { message: 'Too many requests. Please try again later.' }
  }
  const fields = Object.fromEntries([...form.entries()].filter(([k]) => k !== 'photos'))
  const parsed = repairSchema.safeParse(fields)
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }

  const files = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length > MAX_REPAIR_PHOTOS) {
    return { errors: { photos: `Add at most ${MAX_REPAIR_PHOTOS} photos.` } }
  }
  const photos: Photo[] = []
  for (const file of files) {
    const res = await processPhoto(file)
    if (!res.ok) return { errors: { photos: `${file.name}: ${res.error}` } }
    photos.push(res.photo)
  }

  const { consent: _c, ...input } = parsed.data
  void _c
  const user = await getSessionUser()
  const { token, hash } = newAccessToken()
  const created = await getShopStore().createRepair(
    { ...input, userId: user?.id ?? null },
    photos,
    hash,
  )
  if (!created.ok) return { message: created.error }
  redirect(`/repairs/status/${created.data.number}?t=${token}&new=1`)
}

export type RepairLookupState = FormState & {
  repair?: Pick<
    RepairRequest,
    'number' | 'status' | 'deviceName' | 'issueName' | 'estimate' | 'finalPriceCents' | 'createdAt'
  > & { events: RepairEvent[] }
}

/** Status lookup with repair number + e-mail address (no account needed). */
export async function lookupRepairAction(
  _prev: RepairLookupState,
  form: FormData,
): Promise<RepairLookupState> {
  if (!lookupLimiter.hit(`lookup:${await clientIp()}`)) {
    return { message: 'Too many lookups. Wait a few minutes and try again.' }
  }
  const parsed = repairLookupSchema.safeParse(Object.fromEntries(form))
  const notFound = { message: 'No repair found with that number and e-mail address.' }
  if (!parsed.success) return { errors: fieldErrors(parsed.error) }
  if (!isReference('RS', parsed.data.number)) return notFound
  const r = await getShopStore().getRepairByNumber(parsed.data.number)
  if (!r || r.email.toLowerCase() !== parsed.data.email) return notFound
  return {
    ok: true,
    repair: {
      number: r.number,
      status: r.status,
      deviceName: r.deviceName,
      issueName: r.issueName,
      estimate: r.estimate,
      finalPriceCents: r.finalPriceCents,
      createdAt: r.createdAt,
      events: r.events,
    },
  }
}
