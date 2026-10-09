import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './contrast'

// Read the palette straight from globals.css so this test can't drift from the real tokens.
const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8')
const palette = Object.fromEntries(
  [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
)
const c = (name: string) => {
  const hex = palette[name] ?? (name.startsWith('#') ? name : undefined)
  if (!hex) throw new Error(`Unknown token ${name}`)
  return hex
}

/** Every text/background pair used in the UI. [label, foreground, background] */
const textPairs: [string, string, string][] = [
  // LCD screens
  ['LCD text', 'lcd-900', 'lcd-200'],
  ['LCD text on light label', 'lcd-900', 'lcd-50'],
  ['LCD text on dark label end', 'lcd-900', 'lcd-400'],
  ['Screen button', 'lcd-200', 'lcd-900'],
  ['Primary button', 'lcd-900', 'lcd-200'],
  ['GBC panel text', 'gbc-deep', 'gbc-50'],
  ['GBC label end', 'gbc-deep', 'gbc-soft'],
  ['GBC badge', 'gbc-50', 'gbc-deep'],
  // dark theme
  ['Dark body', '#ececea', 'shell-950'],
  ['Dark body on surface', '#ececea', 'shell-900'],
  ['Dark body on surface-2', '#ececea', 'shell-800'],
  ['Dark muted', 'shell-300', 'shell-950'],
  ['Dark muted on surface', 'shell-300', 'shell-900'],
  ['Dark muted on surface-2', 'shell-300', 'shell-800'],
  ['Dark GB accent text', 'lcd-200', 'shell-900'],
  ['Dark GBC accent text', 'gbc-soft', 'shell-900'],
  // light theme
  ['Light body on paper', 'ink', 'paper'],
  ['Light body on shell', 'ink', 'shell-100'],
  ['Light muted on paper', '#45454c', 'paper'],
  ['Light muted on shell', '#45454c', 'shell-100'],
  ['Light muted on surface-2', '#45454c', '#e9e3d1'],
  ['Light GB accent text', 'lcd-700', 'paper'],
  ['Light GBC accent text', '#6c3483', 'paper'],
  // stickers
  ['Yellow sticker', 'ink', 'sticker'],
  ['Red sticker', '#ffffff', 'sticker-red'],
  ['Rumble sticker', 'sticker', 'shell-800'],
  ['Grey cart text', 'ink', 'cart-grey'],
  ['Black cart text', '#ececea', 'cart-black'],
]

describe('colour contrast (WCAG AA, 4.5:1 for text)', () => {
  it.each(textPairs)('%s', (_label, fg, bg) => {
    expect(contrastRatio(c(fg), c(bg))).toBeGreaterThanOrEqual(4.5)
  })

  it('computes known ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5)
  })
})
