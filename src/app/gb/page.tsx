import type { Metadata } from 'next'
import { PlatformHub } from '@/components/catalog/PlatformHub'

export const metadata: Metadata = {
  title: 'Game Boy',
  description: 'Browse every Game Boy game in the Save Slot archive.',
}

export default function GameBoyPage({ searchParams }: PageProps<'/gb'>) {
  return <PlatformHub platform="gb" searchParams={searchParams} />
}
