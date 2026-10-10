'use client'

/**
 * Last-resort screen when the root layout itself fails. It replaces the whole document,
 * so it can't rely on the app shell, fonts or theme tokens: plain inline styles only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#141416',
          color: '#0f380f',
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        <main
          style={{
            background: '#9bbc0f',
            border: '12px solid #2a2a2f',
            padding: '2rem',
            maxWidth: '28rem',
            textAlign: 'center',
          }}
        >
          <h1 style={{ margin: 0, letterSpacing: '0.1em' }}>GAME OVER</h1>
          <p>Save Slot crashed while starting up.</p>
          {error.digest ? <p style={{ fontSize: '0.8rem' }}>Error code: {error.digest}</p> : null}
          <p>CONTINUE?</p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              font: 'inherit',
              background: '#0f380f',
              color: '#9bbc0f',
              border: 0,
              padding: '0.75rem 1.5rem',
              minHeight: '44px',
              cursor: 'pointer',
            }}
          >
            ▶ YES
          </button>
        </main>
      </body>
    </html>
  )
}
