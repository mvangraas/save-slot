import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthForms } from '@/components/auth/AuthForms'
import { EmptyState } from '@/components/retro/EmptyState'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { LoadingState } from '@/components/retro/LoadingState'
import { getBackend, safeNext } from '@/lib/backend'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } }

export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <LcdPanel bezelLabel="Player select" scanlines>
        <h1 className="font-pixel text-base leading-relaxed sm:text-lg">PRESS START</h1>
        <p className="mt-2 text-sm">
          Sign in to keep your collection, wishlist and memories in one save file.
        </p>
      </LcdPanel>
      <Suspense fallback={<LoadingState />}>
        <LoginBody searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function LoginBody({ searchParams }: { searchParams: PageProps<'/login'>['searchParams'] }) {
  const params = await searchParams
  const next = safeNext(params.next)
  const backend = getBackend()
  if (await backend.auth.getUser()) redirect(next)

  if (backend.mode === 'none') {
    return (
      <EmptyState
        title="SIGN-IN NOT CONNECTED"
        description={
          <p>Accounts need the Supabase settings. Browsing the game database works without them.</p>
        }
      />
    )
  }

  return (
    <div className="rounded-sm bg-surface p-5 sm:p-6">
      {params.error === 'link' ? (
        <p role="alert" className="mb-4 bg-sticker-red px-3 py-2 font-display text-sm text-white">
          That link has expired or was already used. Try again.
        </p>
      ) : null}
      <AuthForms
        next={next}
        magicLink={backend.auth.supportsMagicLink}
        initialMode={params.mode === 'signup' ? 'signup' : 'signin'}
      />
    </div>
  )
}
