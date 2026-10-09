'use client'

import { useSyncExternalStore } from 'react'

/** Subscribe to a data-* attribute on <html>, e.g. data-theme set by the boot script. */
export function useHtmlAttribute(name: string): string | null {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: [name] })
      return () => observer.disconnect()
    },
    () => document.documentElement.getAttribute(name),
    () => null,
  )
}

export function setHtmlAttribute(name: string, value: string, storageKey: string) {
  document.documentElement.setAttribute(name, value)
  try {
    localStorage.setItem(storageKey, value)
  } catch {
    // storage can be unavailable (private mode); the attribute still applies for this visit
  }
}
