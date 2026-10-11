import type { Metadata } from 'next'
import { RepairLookup } from '@/components/repairs/RepairLookup'

export const metadata: Metadata = {
  title: 'Track your repair',
  description: 'Follow the status of your Game Boy repair with your repair number.',
}

export default function RepairStatusLookupPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-pixel text-lg leading-relaxed sm:text-xl">TRACK YOUR REPAIR</h1>
        <p className="max-w-prose text-fg-muted">
          Enter the repair number from your confirmation and the e-mail address you used.
        </p>
      </header>
      <RepairLookup />
    </div>
  )
}
