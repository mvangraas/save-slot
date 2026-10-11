import { z } from 'zod'
import { checkbox, emailSchema, optionalText, priceSchema } from '@/lib/backend/schemas'
import {
  DELIVERY_METHODS,
  ORDER_STATUSES,
  PRODUCT_CONDITIONS,
  PRODUCT_SORTS,
  REPAIR_STATUSES,
} from './types'

const name = z.string().trim().min(2, 'Enter your name.').max(120)
const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{6,20}$/, 'Enter a valid phone number.')

/** One cart line as sent by the browser. Prices are never taken from the client. */
export const cartSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(80),
      quantity: z.number().int().min(1).max(10),
    }),
  )
  .min(1, 'Your cart is empty.')
  .max(30)

const postalCode = z.string().trim().toUpperCase().max(10)

export const checkoutSchema = z
  .object({
    name,
    email: emailSchema,
    phone: optionalText(40),
    street: z.string().trim().min(2, 'Enter your street.').max(120),
    houseNumber: z.string().trim().min(1, 'Enter your house number.').max(12),
    postalCode,
    city: z.string().trim().min(2, 'Enter your city.').max(80),
    country: z.enum(['NL', 'BE'], { message: 'We ship to the Netherlands and Belgium.' }),
    acceptTerms: checkbox.refine((v) => v, 'Please accept the terms and conditions.'),
    cart: z
      .string()
      .transform((s, ctx) => {
        try {
          return JSON.parse(s) as unknown
        } catch {
          ctx.addIssue({ code: 'custom', message: 'Your cart could not be read.' })
          return z.NEVER
        }
      })
      .pipe(cartSchema),
  })
  .superRefine((v, ctx) => {
    const re = v.country === 'NL' ? /^[1-9][0-9]{3} ?[A-Z]{2}$/ : /^[1-9][0-9]{3}$/
    if (!re.test(v.postalCode)) {
      ctx.addIssue({
        code: 'custom',
        path: ['postalCode'],
        message: v.country === 'NL' ? 'Use a postcode like 1234 AB.' : 'Use a postcode like 1000.',
      })
    }
  })

export const productQuerySchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.string().trim().max(60).optional().catch(undefined),
  condition: z.enum(PRODUCT_CONDITIONS).optional().catch(undefined),
  inStock: z
    .string()
    .optional()
    .transform((v) => v === '1')
    .catch(false),
  sort: z.enum(PRODUCT_SORTS).catch('newest'),
  page: z.coerce.number().int().min(1).max(500).catch(1),
})

const today = () => new Date().toISOString().slice(0, 10)

export const repairSchema = z
  .object({
    name,
    email: emailSchema,
    phone,
    deviceId: z.string().min(1, 'Choose a device.').max(80),
    issueId: z.string().min(1, 'Choose the problem.').max(80),
    brand: optionalText(60),
    model: optionalText(60),
    serial: optionalText(60),
    description: z
      .string()
      .trim()
      .min(10, 'Describe the problem in at least 10 characters.')
      .max(3000),
    delivery: z.enum(DELIVERY_METHODS, { message: 'Choose how you get the device to us.' }),
    preferredDate: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : null))
      .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Use a valid date.'),
    consent: checkbox.refine((v) => v, 'Please agree to the privacy statement.'),
  })
  .superRefine((v, ctx) => {
    if (v.preferredDate && v.preferredDate < today()) {
      ctx.addIssue({
        code: 'custom',
        path: ['preferredDate'],
        message: 'Pick a date in the future.',
      })
    }
  })

export const repairLookupSchema = z.object({
  number: z.string().trim().toUpperCase().max(12),
  email: emailSchema,
})

// ---- admin

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes.')
  .max(80)

export const productFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.').max(120),
  slug,
  description: z.string().trim().max(5000).default(''),
  categoryId: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  price: priceSchema.refine((v) => v !== null, 'Enter a price.'),
  stock: z.coerce.number().int('Whole numbers only.').min(0).max(100000),
  condition: z.enum(PRODUCT_CONDITIONS),
  specs: z
    .string()
    .max(4000)
    .default('')
    .transform((s) =>
      s
        .split('\n')
        .map((line) => line.split(':'))
        .filter((parts) => parts.length >= 2 && parts[0].trim())
        .map(([label, ...rest]) => ({ label: label.trim(), value: rest.join(':').trim() }))
        .slice(0, 30),
    ),
  active: checkbox,
})

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.').max(60),
  slug,
})

export const orderStatusSchema = z.enum(ORDER_STATUSES)
export const repairStatusSchema = z.enum(REPAIR_STATUSES)

const optionalInt = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null
    const n = Number(v)
    if (!Number.isInteger(n) || n < 0 || n > 365) {
      ctx.addIssue({ code: 'custom', message: 'Whole number of days.' })
      return z.NEVER
    }
    return n
  })

export const repairPriceSchema = z
  .object({
    deviceId: z.string().min(1).max(80),
    issueId: z.string().min(1).max(80),
    priceFrom: priceSchema,
    priceTo: priceSchema,
    daysMin: optionalInt,
    daysMax: optionalInt,
  })
  .superRefine((v, ctx) => {
    if (v.priceFrom !== null && v.priceTo !== null && v.priceTo < v.priceFrom) {
      ctx.addIssue({ code: 'custom', path: ['priceTo'], message: '“To” must be at least “from”.' })
    }
    if (v.daysMin !== null && v.daysMax !== null && v.daysMax < v.daysMin) {
      ctx.addIssue({ code: 'custom', path: ['daysMax'], message: 'Max must be at least min.' })
    }
  })
