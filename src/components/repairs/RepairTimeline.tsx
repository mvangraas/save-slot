import { formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import {
  REPAIR_STATUSES,
  repairStatusLabel,
  type RepairEvent,
  type RepairStatus,
} from '@/lib/shop/types'

/** Progress through the repair statuses, plus any notes the workshop shared. */
export function RepairTimeline({
  status,
  events,
}: {
  status: RepairStatus
  events: RepairEvent[]
}) {
  const current = REPAIR_STATUSES.indexOf(status)
  return (
    <div className="space-y-5">
      <ol className="grid gap-2 sm:grid-cols-6" aria-label="Repair progress">
        {REPAIR_STATUSES.map((s, i) => (
          <li
            key={s}
            aria-current={i === current ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2 p-2 font-display text-xs uppercase sm:flex-col sm:text-center',
              i < current && 'bg-lcd-700 text-lcd-50',
              i === current && 'bg-lcd-200 text-lcd-900',
              i > current && 'bg-surface-2 text-fg-muted',
            )}
          >
            <span aria-hidden className="font-pixel text-[0.625rem]">
              {i < current ? '✓' : i + 1}
            </span>
            <span>
              {repairStatusLabel[s]}
              <span className="sr-only">
                {i < current ? ' (done)' : i === current ? ' (current)' : ''}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <ul className="space-y-2" aria-label="Updates">
        {[...events].reverse().map((e, i) => (
          <li key={i} className="bg-surface p-3 text-sm">
            <p className="font-display text-xs uppercase">
              {repairStatusLabel[e.status]} ·{' '}
              <time dateTime={e.createdAt}>{formatDate(e.createdAt)}</time>
            </p>
            {e.note ? <p className="mt-1">{e.note}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
