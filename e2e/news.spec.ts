import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const SECRET = 'e2e-cron-secret-0123456789'

test.describe.configure({ mode: 'serial' })

test('cron route rejects requests without the secret', async ({ request }) => {
  expect((await request.get('/api/cron/news')).status()).toBe(401)
  const wrong = await request.get('/api/cron/news', {
    headers: { authorization: 'Bearer wrong-secret-wrong-secret' },
  })
  expect(wrong.status()).toBe(401)
})

test('cron ingests only Game Boy news, per source, and /news shows it', async ({
  request,
  page,
}) => {
  const res = await request.get('/api/cron/news', {
    headers: { authorization: `Bearer ${SECRET}` },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  const bySource = Object.fromEntries(body.sources.map((s: { source: string }) => [s.source, s]))
  expect(bySource['time-extension']).toMatchObject({ ok: true, stored: 1 })
  expect(bySource['gb-studio-central']).toMatchObject({ ok: true, stored: 1 })
  // Sources without a fixture fail on their own without stopping the others.
  expect(bySource['retrorgb'].ok).toBe(false)

  await page.goto('/news')
  const link = page.getByRole('link', { name: /A new Game Boy Color homebrew cart/ })
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute(
    'href',
    'https://www.timeextension.com/news/fixture-gbc-homebrew',
  )
  await expect(
    page.getByText('The Game Boy Color scene keeps on giving & this one has rumble.'),
  ).toBeVisible()
  await expect(page.getByText('Fixture jam results are in')).toBeVisible()
  await expect(page.getByText('A fixture story about a home console')).toHaveCount(0)
  await expect(page.getByText('Unsafe link is dropped')).toHaveCount(0)

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(axe.violations).toEqual([])

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'LATEST NEWS' })).toBeVisible()
})
