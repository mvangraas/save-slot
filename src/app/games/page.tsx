import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Games' }

export default function Page() {
  return <ComingSoon title="GAME DATABASE" phase={2} />
}
