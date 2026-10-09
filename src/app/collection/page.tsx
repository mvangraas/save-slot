import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Collection' }

export default function Page() {
  return <ComingSoon title="MY COLLECTION" phase={3} />
}
