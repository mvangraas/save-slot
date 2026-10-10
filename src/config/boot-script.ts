export const THEME_KEY = 'saveslot:theme'
export const EFFECTS_KEY = 'saveslot:effects'
export const SOUND_KEY = 'saveslot:sound'

/**
 * Runs before first paint to avoid a theme flash.
 * Order: stored choice → OS preference → dark (the default "handheld shell" look).
 */
export const bootScript = `(()=>{try{var d=document.documentElement;var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}d.setAttribute('data-theme',t);var e=localStorage.getItem('${EFFECTS_KEY}');d.setAttribute('data-effects',e==='reduced'?'reduced':'full');d.setAttribute('data-sound',localStorage.getItem('${SOUND_KEY}')==='on'?'on':'off')}catch(_){document.documentElement.setAttribute('data-theme','dark')}})()`
