import { NextResponse, type NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/backend'
import { getShopStore, isAdminEmail } from '@/lib/shop'

/** Customer repair photos: admins only (signed URL in production, bytes in local dev). */
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || !isAdminEmail(user.email)) return new NextResponse('Not found', { status: 404 })
  const path = request.nextUrl.searchParams.get('path') ?? ''
  if (!/^[\w-]+\/[\w-]+\.(webp|jpg|png)$/.test(path))
    return new NextResponse('Not found', { status: 404 })
  const photo = await getShopStore().readRepairPhoto(path)
  if (!photo) return new NextResponse('Not found', { status: 404 })
  if ('url' in photo)
    return NextResponse.redirect(photo.url, { headers: { 'Cache-Control': 'private, no-store' } })
  return new NextResponse(Buffer.from(photo.bytes), {
    headers: { 'Content-Type': photo.contentType, 'Cache-Control': 'private, no-store' },
  })
}
