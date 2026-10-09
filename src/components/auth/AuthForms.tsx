'use client'

import { useState } from 'react'
import { magicLinkAction, signInAction, signUpAction } from '@/app/actions/auth'
import { FormMessage, SubmitButton, TextField } from '@/components/forms/Field'
import { useForm } from '@/components/forms/useForm'
import type { FormState } from '@/lib/backend/schemas'
import { cn } from '@/lib/cn'

type Mode = 'signin' | 'signup' | 'magic'

export function AuthForms({
  next,
  magicLink,
  initialMode = 'signin',
}: {
  next: string
  magicLink: boolean
  initialMode?: Mode
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const tabs: [Mode, string][] = [
    ['signin', 'Sign in'],
    ['signup', 'New save file'],
    ...(magicLink ? ([['magic', 'E-mail link']] as [Mode, string][]) : []),
  ]
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Sign-in method" className="flex flex-wrap gap-1">
        {tabs.map(([m, label]) => (
          <button
            key={m}
            role="tab"
            type="button"
            id={`tab-${m}`}
            aria-selected={mode === m}
            aria-controls={`panel-${m}`}
            onClick={() => setMode(m)}
            className={cn(
              'min-h-11 px-3 font-display text-sm uppercase',
              mode === m ? 'bg-lcd-200 text-lcd-900' : 'bg-surface-2 text-fg-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`}>
        {mode === 'signin' ? (
          <PasswordForm key="in" action={signInAction} next={next} cta="Continue" />
        ) : null}
        {mode === 'signup' ? (
          <PasswordForm
            key="up"
            action={signUpAction}
            next={next}
            cta="Create save file"
            newPassword
          />
        ) : null}
        {mode === 'magic' ? <MagicForm next={next} /> : null}
      </div>
    </div>
  )
}

function PasswordForm({
  action,
  next,
  cta,
  newPassword = false,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>
  next: string
  cta: string
  newPassword?: boolean
}) {
  const { state, pending, formProps } = useForm(action)
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.errors?.email}
      />
      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete={newPassword ? 'new-password' : 'current-password'}
        required
        minLength={newPassword ? 8 : undefined}
        hint={newPassword ? 'At least 8 characters.' : undefined}
        error={state.errors?.password}
      />
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="lg" pendingLabel="LOADING…" pending={pending}>
        {cta}
      </SubmitButton>
    </form>
  )
}

function MagicForm({ next }: { next: string }) {
  const { state, pending, formProps } = useForm(magicLinkAction)
  return (
    <form {...formProps} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <p className="text-sm text-fg-muted">We e-mail you a one-time link. No password needed.</p>
      <TextField
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        error={state.errors?.email}
      />
      <FormMessage ok={state.ok} message={state.message} />
      <SubmitButton size="lg" pendingLabel="SENDING…" pending={pending}>
        Send link
      </SubmitButton>
    </form>
  )
}
