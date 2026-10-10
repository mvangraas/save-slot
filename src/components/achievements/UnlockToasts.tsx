import { cookies } from 'next/headers'
import { achievementByCode } from '@/lib/achievements/definitions'
import { parseUnlockCookie, UNLOCK_COOKIE } from '@/lib/achievements/server'
import { UnlockToast } from './UnlockToast'

/** Reads the one-shot unlock cookie set by saveProgress() and hands it to the client toast. */
export async function UnlockToasts() {
  const codes = parseUnlockCookie((await cookies()).get(UNLOCK_COOKIE)?.value)
  const unlocked = codes.flatMap((code) => {
    const a = achievementByCode(code)
    return a ? [{ code: a.code, name: a.name, icon: a.icon, platform: a.platform }] : []
  })
  return <UnlockToast unlocked={unlocked} cookieName={UNLOCK_COOKIE} />
}
