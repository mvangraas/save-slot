import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Wishlist' }

export default function Page() {
  return <ComingSoon title="WISHLIST" phase={4} />
}
