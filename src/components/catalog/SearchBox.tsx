'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { PlatformBadge } from '@/components/retro/PlatformBadge'
import type { Suggestion } from '@/lib/catalog/types'
import { cn } from '@/lib/cn'

/**
 * Search field with autocomplete (WAI-ARIA combobox, list autocomplete).
 * Typing + Enter submits the surrounding form; picking a suggestion opens that game.
 */
export function SearchBox({
  defaultValue = '',
  autoFocus = false,
}: {
  defaultValue?: string
  autoFocus?: boolean
}) {
  const router = useRouter()
  const id = useId()
  const listId = `${id}-list`
  const [value, setValue] = useState(defaultValue)
  const [items, setItems] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const abort = useRef<AbortController | null>(null)
  // Only suggest after the user types; don't pop the list open on page load.
  const typed = useRef(false)

  useEffect(() => {
    const q = value.trim()
    if (!typed.current || q.length < 2) return
    const timer = setTimeout(async () => {
      abort.current?.abort()
      const ctrl = new AbortController()
      abort.current = ctrl
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        })
        if (!res.ok) return
        const data = (await res.json()) as { items: Suggestion[] }
        setItems(data.items)
        setActive(-1)
        setOpen(data.items.length > 0)
      } catch {
        // aborted or offline: keep the plain search working
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [value])

  const go = (s: Suggestion) => {
    setOpen(false)
    router.push(`/games/${s.slug}`)
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Search games
      </label>
      <div className="flex items-center bg-lcd-200 text-lcd-900 shadow-[inset_0_0_0_2px_rgb(0_0_0/0.25)]">
        <span aria-hidden className="pl-3 font-pixel text-xs">
          ▶
        </span>
        <input
          id={id}
          name="q"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="Search title, publisher, genre…"
          value={value}
          maxLength={80}
          onChange={(e) => {
            typed.current = true
            setValue(e.target.value)
            if (e.target.value.trim().length < 2) setOpen(false)
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onFocus={() => items.length > 0 && value.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (!open) return
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((a) => (a + 1) % items.length)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((a) => (a <= 0 ? items.length - 1 : a - 1))
            } else if (e.key === 'Enter' && active >= 0) {
              e.preventDefault()
              go(items[active])
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          className="min-h-12 w-full bg-transparent px-3 font-mono text-base placeholder:text-lcd-700 focus:outline-none"
        />
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label="Suggestions"
        hidden={!open}
        className="absolute inset-x-0 top-full z-30 mt-1 bg-surface shadow-[0_4px_0_0_rgb(0_0_0/0.4)]"
      >
        {items.map((s, i) => (
          <li
            key={s.slug}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault()
              go(s)
            }}
            onMouseEnter={() => setActive(i)}
            className={cn(
              'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm',
              i === active && 'bg-surface-2',
            )}
          >
            <PlatformBadge platform={s.platform} />
            <span className="flex-1">{s.title}</span>
            {s.year ? <span className="font-mono text-xs text-fg-muted">{s.year}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
