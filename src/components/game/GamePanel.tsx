import { addCollectionItemAction } from '@/app/actions/collection'
import {
  removeMemoryAction,
  setFavoriteAction,
  setPlayStatusAction,
  setScoreAction,
  toggleWishlistAction,
} from '@/app/actions/game'
import { ItemCard } from '@/components/collection/ItemCard'
import { ItemForm, type ReleaseOption } from '@/components/collection/ItemForm'
import { MemoryForm } from './MemoryForm'
import { AutoSubmitSelect } from '@/components/forms/AutoSubmit'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { ManualSection } from '@/components/retro/ManualSection'
import { PixelButton } from '@/components/retro/PixelButton'
import { getUserContext } from '@/lib/backend'
import { PLAY_STATUSES, playStatusLabel, type GameUserState } from '@/lib/backend/types'
import type { GameDetail } from '@/lib/catalog/types'
import { regionLabel } from '@/lib/types'

const selectCls =
  'min-h-11 rounded-none border-2 border-lcd-900 bg-lcd-50 px-2 text-sm text-lcd-900 focus-visible:outline-3'

function releaseOptions(game: GameDetail): ReleaseOption[] {
  return game.releases.map((r) => ({
    id: r.id,
    label: `${regionLabel[r.region]}${r.localTitle ? ` — ${r.localTitle}` : ''}${r.productCode ? ` (${r.productCode})` : ''}`,
  }))
}

/** "Your copy" box on the game page. Reads the session → render inside <Suspense>. */
export async function GamePanel({ game }: { game: GameDetail }) {
  const ctx = await getUserContext()
  const returnTo = `/games/${game.slug}`

  if (!ctx) {
    return (
      <LcdPanel scanlines={false} className="max-w-xl" screenClassName="p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <PixelButton
            href={`/login?next=${encodeURIComponent(returnTo)}`}
            variant="screen"
            size="sm"
          >
            Sign in to collect
          </PixelButton>
          <p className="text-sm">Track your copy, rating, play status and memories.</p>
        </div>
      </LcdPanel>
    )
  }

  const state = await ctx.store.gameState(game.id)
  return <Controls game={game} state={state} returnTo={returnTo} />
}

function Controls({
  game,
  state,
  returnTo,
}: {
  game: GameDetail
  state: GameUserState
  returnTo: string
}) {
  return (
    <LcdPanel
      scanlines={false}
      className="max-w-xl"
      screenClassName="p-3 sm:p-4 space-y-3"
      aria-labelledby="quick-title"
    >
      <h2 id="quick-title" className="sr-only">
        Your copy
      </h2>
      <p className="font-pixel text-[0.625rem]">
        {state.items.length > 0
          ? `IN YOUR COLLECTION · ${state.items.length} ${state.items.length === 1 ? 'COPY' : 'COPIES'}`
          : 'NOT IN YOUR COLLECTION YET'}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <form action={toggleWishlistAction}>
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="wishlisted" value={String(!state.wishlisted)} />
          <PixelButton type="submit" variant="screen" size="sm" aria-pressed={state.wishlisted}>
            {state.wishlisted ? '♥ On wishlist' : '♡ Wishlist'}
          </PixelButton>
        </form>

        <form action={setFavoriteAction} className="flex items-center gap-2">
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input type="hidden" name="isFavorite" value={String(!state.isFavorite)} />
          <PixelButton type="submit" variant="screen" size="sm" aria-pressed={state.isFavorite}>
            {state.isFavorite ? '★ Favorite' : '☆ Favorite'}
          </PixelButton>
        </form>

        {/* keyed by the saved value so React's post-action form reset shows the new value */}
        <form
          key={`score-${state.score ?? 'none'}`}
          action={setScoreAction}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label htmlFor="score" className="font-display text-xs uppercase">
            Rating
          </label>
          <AutoSubmitSelect
            id="score"
            name="score"
            defaultValue={state.score ?? ''}
            className={selectCls}
          >
            <option value="">–</option>
            {Array.from({ length: 10 }, (_, i) => 10 - i).map((n) => (
              <option key={n} value={n}>
                {n}/10
              </option>
            ))}
          </AutoSubmitSelect>
          <noscript>
            <button type="submit">Save</button>
          </noscript>
        </form>

        <form
          key={`play-${state.playStatus ?? 'none'}`}
          action={setPlayStatusAction}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="gameId" value={game.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label htmlFor="status" className="font-display text-xs uppercase">
            Play
          </label>
          <AutoSubmitSelect
            id="status"
            name="status"
            defaultValue={state.playStatus ?? ''}
            className={selectCls}
          >
            <option value="">Not set</option>
            {PLAY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {playStatusLabel[s]}
              </option>
            ))}
          </AutoSubmitSelect>
          <noscript>
            <button type="submit">Save</button>
          </noscript>
        </form>
      </div>
    </LcdPanel>
  )
}

/** Owned copies + add form, and memories. Reads the session → render inside <Suspense>. */
export async function GameCollectionSections({ game }: { game: GameDetail }) {
  const ctx = await getUserContext()
  if (!ctx) return null
  const state = await ctx.store.gameState(game.id)
  const returnTo = `/games/${game.slug}`
  const releases = releaseOptions(game)

  return (
    <>
      <ManualSection number={5} title="Your copies" className="lg:col-span-2" id="your-copies">
        <div className="space-y-5 text-fg">
          {state.items.length > 0 ? (
            <ul className="space-y-3">
              {state.items.map((item) => (
                <ItemCard key={item.id} item={item} releases={releases} returnTo={returnTo} />
              ))}
            </ul>
          ) : null}
          <details open={state.items.length === 0} className="group bg-surface p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-display text-sm uppercase">
              + Add a copy to your collection
            </summary>
            <div className="pt-3">
              <ItemForm
                releases={releases}
                action={addCollectionItemAction}
                returnTo={returnTo}
                submitLabel="Add to collection"
              />
            </div>
          </details>
        </div>
      </ManualSection>

      <ManualSection number={6} title="Memories" className="lg:col-span-2" id="memories">
        <div className="space-y-5">
          {state.memories.length > 0 ? (
            <ul className="space-y-3">
              {state.memories.map((m) => (
                <li key={m.id} className="border-l-4 border-lcd-700 pl-4">
                  <p className="whitespace-pre-line">{m.body}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#45454c]">
                    {m.yearRemembered ? (
                      <span className="font-mono">{m.yearRemembered}</span>
                    ) : null}
                    <span>{m.isPublic ? 'Public' : 'Private'}</span>
                    <form action={removeMemoryAction}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button type="submit" className="min-h-9 underline hover:no-underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              What do you remember about this game? Only you can see it, unless you make it public.
            </p>
          )}
          <div className="bg-surface p-4 text-fg">
            <MemoryForm gameId={game.id} returnTo={returnTo} />
          </div>
        </div>
      </ManualSection>
    </>
  )
}
