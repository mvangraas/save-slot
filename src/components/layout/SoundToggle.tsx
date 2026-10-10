'use client'

import { SOUND_KEY } from '@/config/boot-script'
import { setHtmlAttribute, useHtmlAttribute } from '@/lib/html-attr-store'
import { playSound } from '@/lib/sound'

/** Optional 8-bit blips. Off by default. */
export function SoundToggle() {
  const on = useHtmlAttribute('data-sound') === 'on'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        setHtmlAttribute('data-sound', on ? 'off' : 'on', SOUND_KEY)
        if (!on) playSound('save')
      }}
      className="inline-flex min-h-11 items-center gap-2 text-sm text-fg-muted hover:text-fg"
    >
      <span
        aria-hidden
        className={`inline-block h-4 w-7 p-0.5 ${on ? 'bg-lcd-200' : 'bg-shell-600'}`}
      >
        <span
          className={`block size-3 bg-shell-950 transition-transform ${on ? 'translate-x-3' : ''}`}
        />
      </span>
      Sound effects
    </button>
  )
}
