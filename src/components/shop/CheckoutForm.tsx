'use client'

import Link from 'next/link'
import { checkoutAction } from '@/app/actions/shop'
import { Field, FormMessage, inputCls, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { EmptyState } from '@/components/retro/EmptyState'
import { LoadingState } from '@/components/retro/LoadingState'
import { PixelButton } from '@/components/retro/PixelButton'
import { formatEuro } from '@/lib/format'
import { useCartProducts } from './CartView'

type Props = {
  shippingCents: number
  freeShippingFromCents: number | null
  vatNote: string
  sellerName: string
}

export function CheckoutForm({ shippingCents, freeShippingFromCents, vatNote, sellerName }: Props) {
  const { lines, rows, subtotal, overStock, loading } = useCartProducts()
  const { state, pending, formProps } = useForm(checkoutAction)

  if (lines.length === 0) {
    return (
      <EmptyState
        title="YOUR CART IS EMPTY"
        action={
          <PixelButton href="/shop" variant="screen">
            Browse products
          </PixelButton>
        }
      />
    )
  }
  if (loading) return <LoadingState label="Loading cart" />

  const shipping =
    freeShippingFromCents !== null && subtotal >= freeShippingFromCents ? 0 : shippingCents
  const e = state.errors ?? {}

  return (
    <form {...formProps} className="grid gap-8 lg:grid-cols-[3fr_2fr]" noValidate>
      <input
        type="hidden"
        name="cart"
        value={JSON.stringify(rows.map((r) => ({ productId: r.product.id, quantity: r.quantity })))}
      />
      <div className="space-y-6">
        <fieldset className="space-y-4 bg-surface p-5">
          <legend className="font-display text-sm uppercase">Your details</legend>
          <TextField label="Full name" name="name" autoComplete="name" required error={e.name} />
          <TextField
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            hint="For your order confirmation and shipping updates."
            error={e.email}
          />
          <TextField
            label="Phone (optional)"
            name="phone"
            type="tel"
            autoComplete="tel"
            hint="Only used if there is a problem with delivery."
            error={e.phone}
          />
        </fieldset>
        <fieldset className="grid gap-4 bg-surface p-5 sm:grid-cols-[2fr_1fr]">
          <legend className="font-display text-sm uppercase">Delivery address</legend>
          <TextField
            label="Street"
            name="street"
            autoComplete="address-line1"
            required
            error={e.street}
          />
          <TextField label="House number" name="houseNumber" required error={e.houseNumber} />
          <TextField
            label="Postcode"
            name="postalCode"
            autoComplete="postal-code"
            required
            error={e.postalCode}
          />
          <TextField
            label="City"
            name="city"
            autoComplete="address-level2"
            required
            error={e.city}
          />
          <Field label="Country" error={e.country} className="sm:col-span-2">
            {(a11y) => (
              <select
                {...a11y}
                name="country"
                defaultValue="NL"
                autoComplete="country"
                className={inputCls}
              >
                <option value="NL">Netherlands</option>
                <option value="BE">Belgium</option>
              </select>
            )}
          </Field>
        </fieldset>
      </div>

      <aside aria-label="Order summary" className="h-fit space-y-4 bg-surface p-5">
        <h2 className="font-display text-sm uppercase">Order summary</h2>
        <ul className="space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.product.id} className="flex justify-between gap-3">
              <span>
                {r.quantity} × {r.product.name}
              </span>
              <span className="font-mono">{formatEuro(r.product.priceCents * r.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-mono">{formatEuro(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd className="font-mono">{shipping === 0 ? 'Free' : formatEuro(shipping)}</dd>
          </div>
          <div className="flex justify-between font-display text-base uppercase">
            <dt>Total</dt>
            <dd className="font-mono">{formatEuro(subtotal + shipping)}</dd>
          </div>
        </dl>
        <p className="text-xs text-fg-muted">{vatNote}</p>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="acceptTerms"
            className="mt-1 size-5"
            aria-invalid={e.acceptTerms ? true : undefined}
            aria-describedby={e.acceptTerms ? 'terms-error' : undefined}
          />
          <span>
            I accept the{' '}
            <Link href="/legal/terms" target="_blank" className="underline">
              terms and conditions
            </Link>{' '}
            and have read the{' '}
            <Link href="/legal/privacy" target="_blank" className="underline">
              privacy statement
            </Link>{' '}
            of {sellerName}.
          </span>
        </label>
        {e.acceptTerms ? (
          <p id="terms-error" role="alert" className="text-sm text-[#ff8a85]">
            {e.acceptTerms}
          </p>
        ) : null}
        {e.cart ? (
          <p role="alert" className="text-sm text-[#ff8a85]">
            {e.cart}
          </p>
        ) : null}
        {overStock ? (
          <p role="alert" className="text-sm text-[#ff8a85]">
            Some items exceed the stock.{' '}
            <Link href="/shop/cart" className="underline">
              Update your cart
            </Link>
            .
          </p>
        ) : null}
        <PixelButton type="submit" className="w-full" disabled={pending || overStock}>
          {pending ? 'Starting payment…' : 'Order and pay'}
        </PixelButton>
        <p className="text-xs text-fg-muted">
          You pay securely with Mollie (iDEAL, Bancontact or card). Your order is confirmed once the
          payment is received.
        </p>
        <FormMessage ok={state.ok} message={state.message} />
      </aside>
    </form>
  )
}
