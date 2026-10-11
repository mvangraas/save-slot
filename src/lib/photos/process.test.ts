import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { processPhoto, sniffImageType } from './process'

const fixture = readFileSync(join(process.cwd(), 'e2e/fixtures/cartridge-photo.jpg'))
const asFile = (bytes: Uint8Array | Buffer, name = 'p.jpg', type = 'image/jpeg') =>
  new File([new Uint8Array(bytes)], name, { type })

describe('sniffImageType', () => {
  it('detects real formats by magic bytes', () => {
    expect(sniffImageType(new Uint8Array(fixture))).toBe('image/jpeg')
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      'image/png',
    )
    expect(sniffImageType(new TextEncoder().encode('RIFF....WEBPVP8 '))).toBe('image/webp')
    expect(sniffImageType(new TextEncoder().encode('<svg onload=alert(1)>'))).toBeNull()
  })
})

describe('processPhoto', () => {
  it('re-encodes to WebP and strips EXIF metadata', async () => {
    expect((await sharp(fixture).metadata()).exif).toBeDefined()
    const res = await processPhoto(asFile(fixture))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.photo.contentType).toBe('image/webp')
    const meta = await sharp(Buffer.from(res.photo.bytes)).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.exif).toBeUndefined()
  })

  it('rejects non-images, empty and oversized files even with an image type', async () => {
    expect(await processPhoto(asFile(new TextEncoder().encode('<svg/>'), 'x.jpg'))).toEqual({
      ok: false,
      error: 'Only JPEG, PNG or WebP photos.',
    })
    expect((await processPhoto(asFile(new Uint8Array()))).ok).toBe(false)
    const big = new Uint8Array(5 * 1024 * 1024 + 1)
    big.set([0xff, 0xd8, 0xff])
    expect(await processPhoto(asFile(big))).toEqual({
      ok: false,
      error: 'Photos can be at most 5 MB.',
    })
  })

  it('rejects truncated images', async () => {
    const res = await processPhoto(asFile(fixture.subarray(0, 200)))
    expect(res.ok).toBe(false)
  })
})
