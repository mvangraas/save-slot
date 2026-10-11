import { ImageResponse } from 'next/og'
import { getGame } from '@/lib/catalog'
import { compatLabel } from '@/lib/types'

export const alt = 'Save Slot game card'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const shell = {
  gb: { body: '#b8b8b2', label: '#9bbc0f', ink: '#0f380f' },
  gbc_dual: { body: '#2a2a2f', label: '#c39bd3', ink: '#4a1d63' },
  gbc_only: { body: '#c39bd3', label: '#f3e8f8', ink: '#4a1d63' },
} as const

/** Original cartridge placeholder art: no box art or trademarks, just the title on a label. */
export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const game = await getGame(slug)
  const title = game?.title ?? 'Save Slot'
  const c = shell[game?.compat ?? 'gb']
  // Satori needs one text node per non-flex element.
  const subtitle = game
    ? `${compatLabel[game.compat]}${game.firstReleaseYear ? ` · ${game.firstReleaseYear}` : ''}`
    : 'Game Boy collector archive'
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 64,
        padding: 72,
        background: '#141416',
        color: '#ececea',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          width: 340,
          height: 390,
          display: 'flex',
          flexDirection: 'column',
          padding: 28,
          background: c.body,
          borderRadius: 8,
        }}
      >
        <div style={{ height: 10, background: 'rgba(0,0,0,0.2)', marginBottom: 10 }} />
        <div style={{ height: 10, background: 'rgba(0,0,0,0.2)', marginBottom: 28 }} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            background: c.label,
            color: c.ink,
            fontSize: title.length > 24 ? 30 : 38,
            fontWeight: 700,
            textAlign: 'center',
            borderRadius: 6,
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ fontSize: 28, color: '#9bbc0f', letterSpacing: 4 }}>SAVE SLOT</div>
        <div style={{ fontSize: 60, fontWeight: 700, marginTop: 20, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 30, marginTop: 24, color: '#a9a9b2' }}>{subtitle}</div>
      </div>
    </div>,
    size,
  )
}
