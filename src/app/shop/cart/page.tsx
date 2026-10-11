import type { Metadata } from 'next'
import { CartView } from '@/components/shop/CartView'
import { checkoutAvailability } from '@/lib/shop/availability'

export const metadata: Metadata = { title: 'Cart', robots: { index: false } }

export default function CartPage() {
  return (
    <div className="space-y-8">
      <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">YOUR CART</h1>
      <CartView checkoutOpen={checkoutAvailability().open} />
    </div>
  )
}
