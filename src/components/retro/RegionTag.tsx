import { cn } from '@/lib/cn'
import { regionLabel, type Region } from '@/lib/types'

export function RegionTag({ region, className }: { region: Region; className?: string }) {
  return (
    <abbr
      title={regionLabel[region]}
      aria-label={regionLabel[region]}
      className={cn(
        'inline-block border border-current px-1 font-display text-[0.6875rem] leading-4 uppercase no-underline',
        className,
      )}
    >
      {region}
    </abbr>
  )
}
