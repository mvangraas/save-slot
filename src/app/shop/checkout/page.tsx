import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/shop/CheckoutForm'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { PixelButton } from '@/components/retro/PixelButton'
import { readShopConfig, vatNote } from '@/config/shop'
import { checkoutAvailability } from '@/lib/shop/availability'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPage() {
  const cfg = readShopConfig()
  const availability = checkoutAvailability(cfg)
  return (
    <div className="space-y-8">
      <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">CHECKOUT</h1>
      {availability.open && cfg.business && cfg.shippingCents !== null ? (
        <CheckoutForm
          shippingCents={cfg.shippingCents}
          freeShippingFromCents={cfg.freeShippingFromCents}
          vatNote={vatNote[cfg.business.vatMode]}
          sellerName={cfg.business.legalName}
        />
      ) : (
        <LcdPanel as="section" aria-labelledby="closed-title" screenClassName="text-center">
          <h2 id="closed-title" className="font-pixel text-sm leading-relaxed">
            ORDERING OPENS SOON
          </h2>
          <p className="mt-3 text-sm">
            We are still setting up payments and the shop terms. Your cart stays saved in this
            browser, and nothing will be charged until ordering is open.
          </p>
          <div className="mt-5">
            <PixelButton href="/shop/cart" variant="screen">
              Back to cart
            </PixelButton>
          </div>
        </LcdPanel>
      )}
    </div>
  )
}
