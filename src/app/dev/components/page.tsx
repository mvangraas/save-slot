import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  CartridgeCard,
  CartridgeCardSkeleton,
  EmptyState,
  ErrorState,
  LcdPanel,
  LoadingState,
  PixelButton,
  PlatformBadge,
  RegionTag,
  Sticker,
  type StickerKind,
} from '@/components/retro'
import { devPagesEnabled } from '@/lib/env'

export const metadata: Metadata = { title: 'Components', robots: { index: false } }

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4" aria-labelledby={`c-${title}`}>
      <h2 id={`c-${title}`} className="font-pixel text-xs text-gb-text">
        {title.toUpperCase()}
      </h2>
      <div className="rounded-sm bg-surface p-4 sm:p-6">{children}</div>
    </section>
  )
}

const stickers: StickerKind[] = ['cib', 'boxed', 'import', 'sgb', 'rumble', 'owned', 'price', 'new']

export default function ComponentsPage() {
  if (!devPagesEnabled()) notFound()

  return (
    <div className="space-y-12">
      <header>
        <h1 className="font-pixel text-lg">COMPONENTS</h1>
        <p className="mt-2 text-fg-muted">Design system preview. Development only.</p>
      </header>

      <Block title="Cartridge card">
        <div className="flex flex-wrap items-end gap-6">
          <CartridgeCard title="Grey cart" compat="gb" year={1989} regions={['eu', 'us', 'jp']} />
          <CartridgeCard title="Black dual-mode" compat="gbc_dual" year={1998} owned />
          <CartridgeCard title="Clear GBC-only" compat="gbc_only" year={2000} wishlisted />
          <CartridgeCard title="Small linked" compat="gb" size="sm" href="/games" />
          <CartridgeCard title="Large" compat="gbc_dual" size="lg" year={1999} regions={['jp']} />
          <CartridgeCardSkeleton />
        </div>
      </Block>

      <Block title="Pixel button">
        <div className="flex flex-wrap items-center gap-4">
          <PixelButton>Primary</PixelButton>
          <PixelButton variant="secondary">Secondary</PixelButton>
          <PixelButton variant="ghost">Ghost</PixelButton>
          <PixelButton size="sm">Small</PixelButton>
          <PixelButton size="lg">Large</PixelButton>
          <PixelButton disabled>Disabled</PixelButton>
          <PixelButton href="/" variant="secondary">
            As link
          </PixelButton>
        </div>
      </Block>

      <Block title="Badges, regions and stickers">
        <div className="flex flex-wrap items-center gap-3">
          <PlatformBadge platform="gb" />
          <PlatformBadge platform="gbc" />
          <PlatformBadge platform="gb" size="md" />
          <PlatformBadge platform="gbc" size="md" />
          <RegionTag region="eu" />
          <RegionTag region="us" />
          <RegionTag region="jp" />
          {stickers.map((k) => (
            <Sticker key={k} kind={k} />
          ))}
          <Sticker kind="price" tilt>
            €24
          </Sticker>
        </div>
      </Block>

      <Block title="LCD panel">
        <div className="grid gap-6 md:grid-cols-2">
          <LcdPanel bezelLabel="Game Boy">
            <p className="font-pixel text-xs">HELLO, PLAYER 1</p>
            <p className="mt-2 text-sm">Green LCD with subtle scanlines.</p>
          </LcdPanel>
          <LcdPanel tone="gbc" bezelLabel="Game Boy Color">
            <p className="font-pixel text-xs">NOW IN COLOR</p>
            <p className="mt-2 text-sm">Berry panel with the colour-pixel strip.</p>
          </LcdPanel>
        </div>
      </Block>

      <Block title="States">
        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            title="NO DATA ON THIS SAVE FILE"
            description={<p>Add your first cartridge.</p>}
            action={<PixelButton variant="secondary">Add cartridge →</PixelButton>}
          />
          <EmptyState
            tone="gbc"
            title="WISHLIST EMPTY"
            description={<p>Nothing on your list yet.</p>}
          />
          <div className="rounded-sm bg-surface-2">
            <LoadingState />
          </div>
          <ErrorState
            message={<p>Example error.</p>}
            action={<PixelButton variant="secondary">▶ Yes</PixelButton>}
          />
        </div>
      </Block>
    </div>
  )
}
