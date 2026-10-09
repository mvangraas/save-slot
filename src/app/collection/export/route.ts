import { NextResponse } from 'next/server'
import { getUserContext } from '@/lib/backend'
import { collectionToCsv } from '@/lib/backend/collection'

export async function GET() {
  const ctx = await getUserContext()
  if (!ctx) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const csv = collectionToCsv(await ctx.store.listCollection())
  const date = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="save-slot-collection-${date}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
