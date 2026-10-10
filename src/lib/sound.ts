'use client'

/**
 * Tiny 8-bit sound effects, synthesised with Web Audio (square waves, no audio files).
 * Off by default; only plays when <html data-sound="on"> (the footer toggle).
 */
export type SoundName = 'press' | 'save' | 'unlock'

const TUNES: Record<SoundName, [freq: number, ms: number][]> = {
  press: [[880, 30]],
  save: [
    [660, 50],
    [990, 70],
  ],
  unlock: [
    [523, 80],
    [659, 80],
    [784, 80],
    [1047, 160],
  ],
}

let ctx: AudioContext | null = null

export function soundEnabled(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset.sound === 'on'
}

export function playSound(name: SoundName) {
  if (!soundEnabled()) return
  try {
    ctx ??= new AudioContext()
    let t = ctx.currentTime
    for (const [freq, ms] of TUNES[name]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.04, t)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t)
      osc.stop(t + ms / 1000)
      t += ms / 1000
    }
  } catch {
    // Audio can be unavailable (autoplay policy, old browsers): stay silent.
  }
}
