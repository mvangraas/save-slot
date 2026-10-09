import type { ReactNode } from 'react'
import { LcdPanel } from './LcdPanel'

type Props = {
  title?: string
  message?: ReactNode
  /** Usually a retry button or a link home, styled as the "CONTINUE?" choice. */
  action?: ReactNode
  className?: string
}

export function ErrorState({ title = 'GAME OVER', message, action, className }: Props) {
  return (
    <LcdPanel
      className={className}
      screenClassName="text-center"
      as="section"
      aria-labelledby="error-title"
    >
      <h1 id="error-title" className="font-pixel text-lg leading-relaxed sm:text-2xl">
        {title}
      </h1>
      {message ? <div className="mx-auto mt-4 max-w-prose text-sm">{message}</div> : null}
      {action ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="font-pixel text-[0.625rem]">CONTINUE?</p>
          {action}
        </div>
      ) : null}
    </LcdPanel>
  )
}
