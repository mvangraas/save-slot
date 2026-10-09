import type { ReactNode } from 'react'
import type { Platform } from '@/lib/types'
import { LcdPanel } from './LcdPanel'

type Props = {
  title: string
  description?: ReactNode
  action?: ReactNode
  tone?: Platform
  className?: string
}

export function EmptyState({ title, description, action, tone = 'gb', className }: Props) {
  return (
    <LcdPanel tone={tone} className={className} screenClassName="text-center">
      <p className="font-pixel text-xs leading-relaxed sm:text-sm">{title}</p>
      {description ? <div className="mx-auto mt-3 max-w-prose text-sm">{description}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </LcdPanel>
  )
}
