import type { Metadata } from 'next'
import { ComingSoon } from '@/components/ComingSoon'

export const metadata: Metadata = { title: 'Sign in' }

export default function Page() {
  return <ComingSoon title="SIGN IN" phase={3} />
}
