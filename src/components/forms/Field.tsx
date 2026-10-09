'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { useFormStatus } from 'react-dom'
import { PixelButton } from '@/components/retro/PixelButton'
import { cn } from '@/lib/cn'

export const inputCls =
  'min-h-11 w-full rounded-none border-2 border-line bg-surface px-3 text-base text-fg placeholder:text-fg-muted aria-[invalid=true]:border-power'

export function Field({
  label,
  error,
  hint,
  children,
  className,
}: {
  label: string
  error?: string
  hint?: string
  className?: string
  children: (props: {
    id: string
    'aria-invalid'?: boolean
    'aria-describedby'?: string
  }) => ReactNode
}) {
  const id = useId()
  const describedBy =
    [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={id}
        className="block font-display text-xs tracking-wide text-fg-muted uppercase"
      >
        {label}
      </label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-[#ff8a85]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextField({
  label,
  error,
  hint,
  className,
  ...input
}: { label: string; error?: string; hint?: string; className?: string } & ComponentProps<'input'>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(a11y) => <input {...a11y} {...input} className={inputCls} />}
    </Field>
  )
}

export function Check({ label, ...input }: { label: ReactNode } & ComponentProps<'input'>) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" {...input} className="size-5 accent-lcd-700" />
      {label}
    </label>
  )
}

export function SubmitButton({
  children,
  pendingLabel = 'SAVING…',
  pending: pendingProp,
  ...props
}: {
  children: ReactNode
  pendingLabel?: string
  pending?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'screen'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const status = useFormStatus()
  const pending = pendingProp ?? status.pending
  return (
    <PixelButton type="submit" disabled={pending} aria-disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </PixelButton>
  )
}

export function FormMessage({ ok, message }: { ok?: boolean; message?: string }) {
  if (!message) return null
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={cn(
        'px-3 py-2 font-display text-sm',
        ok ? 'bg-lcd-200 text-lcd-900' : 'bg-sticker-red text-white',
      )}
    >
      {message}
    </p>
  )
}
