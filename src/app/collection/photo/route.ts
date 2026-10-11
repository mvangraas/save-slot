import { NextResponse, type NextRequest } from 'next/server'
import { getUserContext } from '@/lib/backend'

/** Serves your own photos only: a short-lived signed URL (Supabase) or the bytes (local dev). */
export async function GET(request: NextRequest) {
  const ctx = await getUserContext()
  if (!ctx) return new NextResponse('Not found', { status: 404 })
  const path = request.nextUrl.searchParams.get('path') ?? ''
  if (!/^[0-9a-f-]+\/[\w:-]+\/[0-9a-f-]+\.(webp|jpg|png)$/i.test(path)) {
    return new NextResponse('Not found', { status: 404 })
  }
  const photo = await ctx.store.readPhoto(path)
  if (!photo) return new NextResponse('Not found', { status: 404 })
  if ('url' in photo) {
    return NextResponse.redirect(photo.url, { headers: { 'Cache-Control': 'private, no-store' } })
  }
  return new NextResponse(Buffer.from(photo.bytes), {
    headers: {
      'Content-Type': photo.contentType,
      'Cache-Control': 'private, max-age=60',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
