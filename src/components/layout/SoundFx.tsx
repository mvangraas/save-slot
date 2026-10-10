'use client'

import { useEffect } from 'react'
import { playSound } from '@/lib/sound'

/** A soft "press" blip on every form submit, when sound is switched on. */
export function SoundFx() {
  useEffect(() => {
    const onSubmit = () => playSound('press')
    document.addEventListener('submit', onSubmit, true)
    return () => document.removeEventListener('submit', onSubmit, true)
  }, [])
  return null
}
