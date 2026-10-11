import { connection } from 'next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { formatEstimate } from '@/components/repairs/Estimate'
import { RepairForm } from '@/components/repairs/RepairForm'
import { LcdPanel } from '@/components/retro/LcdPanel'
import { LoadingState } from '@/components/retro/LoadingState'
import { ManualSection } from '@/components/retro/ManualSection'
import { PixelButton } from '@/components/retro/PixelButton'
import { getShopStore } from '@/lib/shop'
import { repairAvailability } from '@/lib/shop/availability'
import { REPAIR_STATUSES, repairStatusLabel } from '@/lib/shop/types'

export const metadata: Metadata = {
  title: 'Repair service',
  description:
    'Repairs for Game Boy, Game Boy Pocket, Light and Color, and cartridges: screens, power, buttons, sound and save batteries. Request a repair and follow its status online.',
}

/** Earliest selectable appointment date (server time, after connection()). */
const tomorrow = () => new Date(new Date().getTime() + 86_400_000).toISOString().slice(0, 10)

export default function RepairsPage() {
  const open = repairAvailability().open
  return (
    <div className="space-y-10">
      <LcdPanel as="section" aria-labelledby="repairs-title">
        <h1 id="repairs-title" className="font-pixel text-base leading-relaxed sm:text-lg">
          REPAIR SERVICE
        </h1>
        <p className="mt-3 max-w-prose text-sm">
          Broken screen, dead speaker or a cartridge that forgets your save? Tell us what is wrong
          and how you want to get the device to us. You get a repair number to follow every step.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {open ? (
            <PixelButton href="#request" variant="screen">
              Request a repair
            </PixelButton>
          ) : null}
          <PixelButton href="/repairs/status" variant="screen">
            Track your repair
          </PixelButton>
        </div>
      </LcdPanel>

      <Suspense fallback={<LoadingState label="Loading repair list" />}>
        <RepairCatalogSection open={open} />
      </Suspense>

      <ManualSection number={3} title="How it works" id="how">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Send your request with a description and, if you like, photos.</li>
          <li>We review it and tell you how to get the device to us.</li>
          <li>After inspection you get the final price. We only repair once you agree.</li>
          <li>Follow the status online with your repair number and e-mail address.</li>
        </ol>
        <p className="mt-3 text-sm">Statuses you will see:</p>
        <ul className="mt-1 flex flex-wrap gap-2 text-xs">
          {REPAIR_STATUSES.map((s) => (
            <li key={s} className="bg-surface px-2 py-1 font-display text-fg uppercase">
              {repairStatusLabel[s]}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          See also our{' '}
          <Link href="/legal/warranty" className="underline">
            warranty
          </Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="underline">
            privacy statement
          </Link>
          .
        </p>
      </ManualSection>
    </div>
  )
}

async function RepairCatalogSection({ open }: { open: boolean }) {
  await connection() // live stock and prices: never prerender at build time
  const catalog = await getShopStore().repairCatalog()
  return (
    <>
      <ManualSection number={1} title="What we repair" id="services">
        <ul className="grid gap-3 sm:grid-cols-2">
          {catalog.issues.map((i) => (
            <li key={i.id} className="bg-surface p-4 text-fg">
              <h3 className="font-display text-sm uppercase">{i.name}</h3>
              <p className="mt-1 text-sm text-fg-muted">{i.description}</p>
            </li>
          ))}
        </ul>
        <div
          className="mt-6 overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Price indications table"
        >
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <caption className="mb-2 text-left text-xs">
              Price and time indications per device. “On request” means we quote after looking at
              the device. Indications are not quotes; the final price is confirmed before repair.
            </caption>
            <thead>
              <tr className="border-b border-ink/40 font-display text-xs uppercase">
                <th scope="col" className="py-1.5 pr-3">
                  Problem
                </th>
                {catalog.devices.map((d) => (
                  <th key={d.id} scope="col" className="py-1.5 pr-3">
                    {d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {catalog.issues.map((i) => (
                <tr key={i.id} className="border-b border-ink/15 last:border-0">
                  <th scope="row" className="py-1.5 pr-3 font-normal">
                    {i.name}
                  </th>
                  {catalog.devices.map((d) => {
                    const p = catalog.prices.find((x) => x.deviceId === d.id && x.issueId === i.id)
                    const { price, days } = formatEstimate(p ?? null)
                    return (
                      <td key={d.id} className="py-1.5 pr-3">
                        {price ?? 'On request'}
                        {days ? <span className="block text-xs text-[#45454c]">{days}</span> : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ManualSection>

      <ManualSection number={2} title="Request a repair" id="request">
        {open ? (
          <div className="bg-bg p-4 text-fg sm:p-5">
            <RepairForm catalog={catalog} minDate={tomorrow()} />
          </div>
        ) : (
          <p>
            Repair requests open soon. We are finishing the setup of our service details and privacy
            statement. Check back shortly.
          </p>
        )}
      </ManualSection>
    </>
  )
}
