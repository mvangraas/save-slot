'use client'

/**
 * Downscales a photo in the browser before upload (max 1600 px, JPEG). Keeps requests well under
 * hosting body limits; the server still validates and re-encodes everything it receives.
 * Falls back to the original file when the browser can't decode it.
 */
export async function shrinkImage(file: File, max = 1600, quality = 0.85): Promise<File> {
  if (!file.type.startsWith('image/') || typeof createImageBitmap !== 'function') return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1_500_000) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality))
    if (!blob) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

/** Copies a form into FormData, shrinking every file under `field`. */
export async function formDataWithShrunkImages(form: HTMLFormElement, field: string) {
  const data = new FormData(form)
  const files = data.getAll(field).filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length > 0) {
    data.delete(field)
    for (const f of await Promise.all(files.map((f) => shrinkImage(f)))) data.append(field, f)
  }
  return data
}
