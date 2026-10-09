'use client'

import { EFFECTS_KEY } from '@/config/boot-script'
import { setHtmlAttribute, useHtmlAttribute } from '@/lib/html-attr-store'

/** "Reduce effects": turns off scanlines and animations, on top of the OS setting. */
export function EffectsToggle() {
  const reduced = useHtmlAttribute('data-effects') === 'reduced'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={reduced}
      onClick={() => setHtmlAttribute('data-effects', reduced ? 'full' : 'reduced', EFFECTS_KEY)}
      className="inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted hover:text-fg"
    >
      <span
        aria-hidden
        className={`inline-block h-4 w-7 p-0.5 ${reduced ? 'bg-lcd-200' : 'bg-shell-600'}`}
      >
        <span
          className={`block size-3 bg-shell-950 transition-transform ${reduced ? 'translate-x-3' : ''}`}
        />
      </span>
      Reduce effects
    </button>
  )
}
