import { NextResponse, type NextRequest } from 'next/server'
import { suggestGames } from '@/lib/catalog'

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, 80)
  if (q.length < 2) return NextResponse.json({ items: [] })
  const items = await suggestGames(q)
  return NextResponse.json(
    { items },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300' } },
  )
}
