import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Game Boy' }

export default function Page() {
  return <ComingSoon title="GAME BOY" phase={2} />
}
