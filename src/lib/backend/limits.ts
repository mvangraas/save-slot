/** Shared limits for user data (kept in sync with the database checks). */
export const WRITES_PER_MINUTE = 120
export const MAX_PHOTOS = 4
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const extFor = (contentType: string) =>
  contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
