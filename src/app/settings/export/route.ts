import { NextResponse } from 'next/server'
import { getUserContext } from '@/lib/backend'

/** Everything Save Slot stores about you, as one JSON file (GDPR-style data export). */
export async function GET() {
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const data = await ctx.store.exportData()
  const date = data.exportedAt.slice(0, 10)
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="save-slot-export-${date}.json"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
