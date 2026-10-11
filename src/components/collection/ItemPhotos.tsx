'use client'

import { removePhotoAction, uploadPhotoAction } from '@/app/actions/photos'
import { FormMessage } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import { PixelButton } from '@/components/retro/PixelButton'
import { MAX_PHOTOS } from '@/lib/backend/limits'
import { formDataWithShrunkImages } from '@/lib/photos/shrink'
import type { CollectionItem } from '@/lib/backend/types'

/** Your own photos of one copy: private, max 4, location data stripped on upload. */
export function ItemPhotos({ item, returnTo }: { item: CollectionItem; returnTo: string }) {
  const { state, pending, formProps } = useForm(uploadPhotoAction, {
    prepare: (form) => formDataWithShrunkImages(form, 'photo'),
  })
  const label = `${item.gameTitle} (${item.region.toUpperCase()})`
  return (
    <div className="space-y-2">
      {item.photoPaths.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={`Your photos of ${label}`}>
          {item.photoPaths.map((path, i) => (
            <li key={path} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- private, per-user photo */}
              <img
                src={`/collection/photo?path=${encodeURIComponent(path)}`}
                alt={`Your photo ${i + 1} of ${label}`}
                width={96}
                height={96}
                loading="lazy"
                className="size-24 object-cover"
              />
              <form action={removePhotoAction} className="absolute top-1 right-1">
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="path" value={path} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className="grid size-8 place-items-center bg-shell-950/80 font-pixel text-[0.625rem] text-white"
                  aria-label={`Delete photo ${i + 1}`}
                >
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : null}
      {item.photoPaths.length < MAX_PHOTOS ? (
        <form {...formProps} className="flex flex-wrap items-end gap-2" noValidate>
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase">Add a photo of your copy</span>
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby={`photo-hint-${item.id}`}
              aria-invalid={state.errors?.photo ? true : undefined}
              className="text-sm file:mr-2 file:border-0 file:bg-surface file:px-3 file:py-2 file:font-display file:text-xs file:uppercase"
            />
          </label>
          <PixelButton type="submit" size="sm" variant="secondary" disabled={pending}>
            {pending ? 'Uploading…' : 'Upload'}
          </PixelButton>
          <p id={`photo-hint-${item.id}`} className="w-full text-xs text-fg-muted">
            JPEG, PNG or WebP, max 5 MB. Only you can see them; location data is removed.
          </p>
          {state.errors?.photo ? (
            <p role="alert" className="w-full bg-sticker-red px-3 py-2 text-sm text-white">
              {state.errors.photo}
            </p>
          ) : null}
          <FormMessage ok={state.ok} message={state.message} />
        </form>
      ) : (
        <p className="text-xs text-fg-muted">Max {MAX_PHOTOS} photos per copy.</p>
      )}
    </div>
  )
}
