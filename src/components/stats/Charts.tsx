import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Count, YearBucket } from '@/lib/backend/stats'

/** Frame for every chart: title, the chart, and a table view for screen readers / data lovers. */
export function ChartFrame({
  id,
  title,
  legend,
  table,
  children,
}: {
  id: string
  title: string
  legend?: ReactNode
  table: ReactNode
  children: ReactNode
}) {
  return (
    <section aria-labelledby={id} className="space-y-4 rounded-sm bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={id} className="font-display text-sm uppercase">
          {title}
        </h2>
        {legend}
      </div>
      <div aria-hidden>{children}</div>
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer content-center font-display text-xs text-fg-muted uppercase hover:text-fg">
          Show as table
        </summary>
        <div className="mt-2 overflow-x-auto">{table}</div>
      </details>
    </section>
  )
}

export function PlatformLegend() {
  return (
    <ul className="flex gap-4 text-xs text-fg-muted" aria-label="Legend">
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-3 rounded-[2px] bg-chart-gb" /> Game Boy
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden className="size-3 rounded-[2px] bg-chart-gbc" /> Game Boy Color
      </li>
    </ul>
  )
}

/** Stacked vertical bars per release year (GB at the bottom, GBC on top). */
export function YearBars({ years }: { years: YearBucket[] }) {
  const max = Math.max(1, ...years.map((y) => y.gb + y.gbc))
  return (
    <div className="flex h-48 items-end gap-[2px] border-b border-line pb-px">
      {years.map((y) => {
        const total = y.gb + y.gbc
        return (
          <div
            key={y.year}
            className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            title={`${y.year}: ${total} game${total === 1 ? '' : 's'} (GB ${y.gb}, GBC ${y.gbc})`}
          >
            <span className="font-mono text-[0.625rem] text-fg-muted opacity-0 group-hover:opacity-100">
              {total || ''}
            </span>
            <div
              className="flex w-full max-w-8 flex-col justify-end gap-[2px]"
              style={{ height: `${(total / max) * 85}%` }}
            >
              {y.gbc > 0 ? (
                <div className="rounded-t-[4px] bg-chart-gbc" style={{ flexGrow: y.gbc }} />
              ) : null}
              {y.gb > 0 ? (
                <div
                  className={cn('bg-chart-gb', y.gbc === 0 && 'rounded-t-[4px]')}
                  style={{ flexGrow: y.gb }}
                />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function YearAxis({ years }: { years: YearBucket[] }) {
  return (
    <div aria-hidden className="flex gap-[2px] font-mono text-[0.625rem] text-fg-muted">
      {years.map((y, i) => (
        <span key={y.year} className="flex-1 text-center">
          {i % 3 === 0 ? `’${String(y.year).slice(2)}` : ''}
        </span>
      ))}
    </div>
  )
}

/** Horizontal bars with a direct label on each row. */
export function HBars({ rows }: { rows: Count[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li
          key={r.label}
          className="grid grid-cols-[8rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[11rem_1fr_auto]"
        >
          <span className="truncate" title={r.label}>
            {r.label}
          </span>
          <span className="h-3 bg-shell-950/40">
            <span
              className="block h-3 rounded-r-[4px] bg-chart-gb"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </span>
          <span className="font-mono text-xs text-fg-muted">{r.count}</span>
        </li>
      ))}
    </ul>
  )
}

export function SimpleTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-line font-display text-xs text-fg-muted uppercase">
          {head.map((h) => (
            <th key={h} scope="col" className="py-1.5 pr-4">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line/40 last:border-0">
            {r.map((c, j) =>
              j === 0 ? (
                <th key={j} scope="row" className="py-1.5 pr-4 font-normal">
                  {c}
                </th>
              ) : (
                <td key={j} className="py-1.5 pr-4 font-mono">
                  {c}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
