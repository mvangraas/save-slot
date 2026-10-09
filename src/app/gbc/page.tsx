import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Game Boy Color' }

export default function Page() {
  return <ComingSoon title="GAME BOY COLOR" phase={2} tone="gbc" />
}
