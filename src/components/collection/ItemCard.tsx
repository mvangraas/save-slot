'use client'

import { useState } from 'react'
import { removeCollectionItemAction, updateCollectionItemAction } from '@/app/actions/collection'
import { PixelButton } from '@/components/retro/PixelButton'
import { RegionTag } from '@/components/retro/RegionTag'
import { Sticker } from '@/components/retro/Sticker'
import { conditionLabel, type CollectionItem } from '@/lib/backend/types'
import { formatEuro } from '@/lib/format'
import { ItemForm, type ReleaseOption } from './ItemForm'
import { ItemPhotos } from './ItemPhotos'

/** One owned copy on the game page, with inline edit and remove. */
export function ItemCard({
  item,
  releases,
  returnTo,
}: {
  item: CollectionItem
  releases: ReleaseOption[]
  returnTo: string
}) {
  const [editing, setEditing] = useState(false)
  const cib = item.hasCart && item.hasBox && item.hasManual
  return (
    <li className="space-y-3 bg-surface-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <RegionTag region={item.region} />
        {cib ? (
          <Sticker kind="cib" />
        ) : (
          <>
            {item.hasCart ? <span className="text-sm">Cartridge</span> : null}
            {item.hasBox ? <Sticker kind="boxed" /> : null}
            {item.hasManual ? <span className="text-sm">+ manual</span> : null}
          </>
        )}
        {item.condition ? (
          <span className="text-sm text-fg-muted">· {conditionLabel[item.condition]}</span>
        ) : null}
        {item.purchasePriceCents != null ? (
          <span className="font-mono text-sm text-fg-muted">
            · {formatEuro(item.purchasePriceCents)}
          </span>
        ) : null}
        {item.purchasedOn ? (
          <span className="font-mono text-sm text-fg-muted">· {item.purchasedOn}</span>
        ) : null}
      </div>
      {item.notes && !editing ? <p className="text-sm">{item.notes}</p> : null}

      <ItemPhotos item={item} returnTo={returnTo} />

      {editing ? (
        <ItemForm
          releases={releases}
          item={item}
          action={updateCollectionItemAction}
          returnTo={returnTo}
          submitLabel="Save changes"
          onDone={() => setEditing(false)}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <PixelButton
          size="sm"
          variant="ghost"
          onClick={() => setEditing((e) => !e)}
          aria-expanded={editing}
        >
          {editing ? 'Cancel' : 'Edit'}
        </PixelButton>
        <form
          action={removeCollectionItemAction}
          onSubmit={(e) => {
            if (!window.confirm('Remove this copy from your collection?')) e.preventDefault()
          }}
        >
          <input type="hidden" name="id" value={item.id} />
          <PixelButton size="sm" variant="ghost" type="submit">
            Remove
          </PixelButton>
        </form>
      </div>
    </li>
  )
}
