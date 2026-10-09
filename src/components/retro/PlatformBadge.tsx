import { cn } from '@/lib/cn'
import { platformLabel, type Platform } from '@/lib/types'

type Props = {
  platform: Platform
  size?: 'sm' | 'md'
  className?: string
}

export function PlatformBadge({ platform, size = 'sm', className }: Props) {
  return (
    <abbr
      title={platformLabel[platform]}
      aria-label={platformLabel[platform]}
      className={cn(
        'inline-flex items-center font-pixel leading-none no-underline select-none',
        size === 'sm' ? 'px-1.5 py-1 text-[0.5625rem]' : 'px-2 py-1.5 text-[0.6875rem]',
        platform === 'gb' ? 'bg-lcd-900 text-lcd-200' : 'bg-gbc-deep text-gbc-50',
        className,
      )}
    >
      {platform === 'gb' ? 'GB' : 'GBC'}
    </abbr>
  )
}
