import { NextResponse, type NextRequest } from 'next/server'
import { getShopStore } from '@/lib/shop'

/** Local development/e2e only: serves product images from the in-memory store. */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path') ?? ''
  if (!/^[\w-]+\/[\w-]+\.(webp|jpg|png)$/.test(path)) return new NextResponse(null, { status: 404 })
  const photo = await getShopStore().readProductImage(path)
  if (!photo) return new NextResponse(null, { status: 404 })
  return new NextResponse(Buffer.from(photo.bytes), {
    headers: { 'Content-Type': photo.contentType, 'Cache-Control': 'public, max-age=300' },
  })
}
