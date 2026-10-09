import type { Metadata } from 'next'
import { PlatformHub } from '@/components/catalog/PlatformHub'

export const metadata: Metadata = {
  title: 'Game Boy Color',
  description: 'Browse every Game Boy Color game in the Save Slot archive.',
}

export default function GameBoyColorPage({ searchParams }: PageProps<'/gbc'>) {
  return <PlatformHub platform="gbc" searchParams={searchParams} />
}
