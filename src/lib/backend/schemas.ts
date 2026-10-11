import { z } from 'zod'
import { ITEM_CONDITIONS, PLAY_STATUSES, WISH_PRIORITIES } from './types'

/** HTML checkbox: present ("on") = true, missing = false. */
export const checkbox = z
  .unknown()
  .optional()
  .transform((v) => v === true || v === 'on' || v === 'true' || v === '1')

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid e-mail address.'))
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use at most 72 characters.')

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
})
export const signUpSchema = z.object({ email: emailSchema, password: passwordSchema })
export const magicLinkSchema = z.object({ email: emailSchema })

/** "12,50" / "12.5" / "€ 12" → cents. Empty → null. */
export const priceSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((v, ctx) => {
    if (!v) return null
    const n = Number(v.replace(/[€\s]/g, '').replace(',', '.'))
    if (!Number.isFinite(n) || n < 0 || n > 100000) {
      ctx.addIssue({ code: 'custom', message: 'Enter a price like 12.50.' })
      return z.NEVER
    }
    return Math.round(n * 100)
  })

export const collectionItemSchema = z
  .object({
    releaseId: z.string().min(1, 'Choose a release.').max(80),
    hasCart: checkbox,
    hasBox: checkbox,
    hasManual: checkbox,
    condition: z
      .enum(ITEM_CONDITIONS)
      .or(z.literal(''))
      .optional()
      .nullable()
      .transform((v) => (v ? v : null)),
    price: priceSchema,
    purchasedOn: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use a valid date.'),
    notes: optionalText(2000),
  })
  .refine((v) => v.hasCart || v.hasBox || v.hasManual, {
    message: 'Tick at least one of cartridge, box or manual.',
    path: ['hasCart'],
  })
  .transform((v) => ({
    releaseId: v.releaseId,
    hasCart: v.hasCart,
    hasBox: v.hasBox,
    hasManual: v.hasManual,
    condition: v.condition,
    purchasePriceCents: v.price,
    purchaseCurrency: v.price === null ? null : 'EUR',
    purchasedOn: v.purchasedOn,
    notes: v.notes,
  }))

/** 1–10, or null to clear. */
export const scoreSchema = z.coerce.number().int().min(1).max(10).nullable()

export const playStatusSchema = z
  .enum(PLAY_STATUSES)
  .or(z.literal(''))
  .transform((v) => (v ? v : null))

export const memorySchema = z.object({
  body: z.string().trim().min(1, 'Write something first.').max(2000),
  yearRemembered: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((v, ctx) => {
      if (!v) return null
      const n = Number(v)
      if (!Number.isInteger(n) || n < 1989 || n > 2100) {
        ctx.addIssue({ code: 'custom', message: 'Use a year from 1989 onwards.' })
        return z.NEVER
      }
      return n
    }),
  isPublic: checkbox,
})

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/, '3–24 characters: letters, numbers and _ only.'),
  displayName: optionalText(40),
  preferredRegion: z.enum(['eu', 'us', 'jp']),
  visibility: z.enum(['private', 'unlisted', 'public']),
})

export const idSchema = z.string().min(1).max(80)

/** First error per field, for showing next to inputs. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}

export type FormState = {
  ok?: boolean
  message?: string
  errors?: Record<string, string>
}

export const wishlistSchema = z.object({
  priority: z.enum(WISH_PRIORITIES),
  preferredRegion: z
    .enum(['eu', 'us', 'jp'])
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  desiredCondition: z
    .enum(ITEM_CONDITIONS)
    .or(z.literal(''))
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  maxPrice: priceSchema,
  notes: optionalText(2000),
})

export const BULK_OPS = ['remove', 'to-wishlist', 'playing', 'completed', 'backlog'] as const
export const bulkSchema = z.object({
  op: z.enum(BULK_OPS),
  ids: z.array(z.string().min(1).max(80)).min(1, 'Select at least one copy.').max(500),
})

export const RATE_LIMITED: FormState = {
  message: 'Too many changes in a short time. Take a breather and try again in a minute.',
}
