import type { Metadata } from 'next'
import { Suspense } from 'react'
import { signOutAction } from '@/app/actions/auth'
import { DeleteAccountForm } from '@/components/settings/DeleteAccountForm'
import { ProfileForm } from '@/components/settings/ProfileForm'
import { LoadingState } from '@/components/retro/LoadingState'
import { ManualSection } from '@/components/retro/ManualSection'
import { PixelButton, pixelButtonClasses } from '@/components/retro/PixelButton'
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
          Theme, “Reduce effects” and sound are saved on this device (header and footer).
        </p>
      </ManualSection>

      <ManualSection number={2} title="Your data" id="data">
        <p>
          Download everything Save Slot stores about you: profile, collection, wishlist, ratings,
          play status, memories and achievements.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Plain links: these are file downloads, not client-side navigations. */}
          <a href="/settings/export" download className={pixelButtonClasses('secondary')}>
            Download my data (JSON)
          </a>
          <a href="/collection/export" download className={pixelButtonClasses('secondary')}>
            Collection as CSV
          </a>
        </div>
      </ManualSection>

      <ManualSection number={3} title="Delete account" id="delete">
        <p>
          This permanently deletes your account and everything in it, including photos. It
          can&apos;t be undone, so download your data first if you want to keep it.
        </p>
        <div className="mt-4 bg-surface p-4 text-fg">
          <DeleteAccountForm />
        </div>
      </ManualSection>
    </>
  )
}
