import 'server-only'
import sharp from 'sharp'
import { MAX_PHOTO_BYTES } from '@/lib/backend/limits'

export type ProcessedPhoto = { bytes: Uint8Array; contentType: 'image/webp' }

/** Identifies JPEG / PNG / WebP by their magic bytes; the browser-supplied type is not trusted. */
export function sniffImageType(b: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (
    b.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)
  ) {
    return 'image/png'
  }
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

/**
 * Validates and re-encodes an upload: max 5 MB, real JPEG/PNG/WebP only, auto-rotated, at most
 * 1600 px, saved as WebP. Re-encoding drops all metadata (EXIF incl. GPS location).
 */
export async function processPhoto(
  file: File,
): Promise<{ ok: true; photo: ProcessedPhoto } | { ok: false; error: string }> {
  if (file.size === 0) return { ok: false, error: 'Choose a photo first.' }
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: 'Photos can be at most 5 MB.' }
  const input = new Uint8Array(await file.arrayBuffer())
  if (!sniffImageType(input)) return { ok: false, error: 'Only JPEG, PNG or WebP photos.' }
  try {
    const out = await sharp(input, { limitInputPixels: 40_000_000, failOn: 'error' })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()
    return { ok: true, photo: { bytes: new Uint8Array(out), contentType: 'image/webp' } }
  } catch {
    return { ok: false, error: 'That image could not be read.' }
  }
}
