'use client'

import type { ComponentProps } from 'react'

/** A <select> that submits its form on change (with a visually hidden fallback button for no-JS). */
export function AutoSubmitSelect(props: ComponentProps<'select'>) {
  return (
    <select
      {...props}
      onChange={(e) => {
        props.onChange?.(e)
        e.currentTarget.form?.requestSubmit()
      }}
    />
  )
}
