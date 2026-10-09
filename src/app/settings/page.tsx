import type { Metadata } from 'next'
import { Suspense } from 'react'
import { signOutAction } from '@/app/actions/auth'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { LoadingState } from '@/components/retro/LoadingState'
import { ManualSection } from '@/components/retro/ManualSection'
import { PixelButton } from '@/components/retro/PixelButton'
import { requireUser } from '@/lib/backend'

export const metadata: Metadata = { title: 'Settings', robots: { index: false } }

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-pixel text-lg">SETTINGS</h1>
      <Suspense fallback={<LoadingState />}>
        <SettingsBody />
      </Suspense>
    </div>
  )
}

async function SettingsBody() {
  const { user, store } = await requireUser('/settings')
  const profile = await store.getProfile()
  return (
    <>
      <section
        aria-labelledby="profile-title"
        className="space-y-4 rounded-sm bg-surface p-5 sm:p-6"
      >
        <h2 id="profile-title" className="font-display text-sm uppercase">
          Profile
        </h2>
        <ProfileForm profile={profile} />
      </section>

      <ManualSection number={1} title="Account">
        <p>
          Signed in as <strong>{user.email}</strong>.
        </p>
        <form action={signOutAction} className="mt-4">
          <PixelButton type="submit" variant="secondary">
            Sign out
          </PixelButton>
        </form>
        <p className="mt-4 text-sm text-[#45454c]">
          Theme and “Reduce effects” are saved on this device (header and footer). Data export and
          deleting your account arrive in a later phase.
        </p>
      </ManualSection>
    </>
  )
}
