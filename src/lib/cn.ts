import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge about our custom font-size-less font families so
// `font-pixel` and `text-xs` are not treated as conflicting.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-family': [{ font: ['pixel', 'display', 'sans', 'mono'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
