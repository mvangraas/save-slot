import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Stats' }

export default function Page() {
  return <ComingSoon title="COLLECTION STATS" phase={4} />
}
