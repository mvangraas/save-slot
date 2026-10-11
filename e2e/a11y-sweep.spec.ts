import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

test.describe.configure({ timeout: 180_000 })

const PUBLIC = [
  '/',
  '/games',
  '/gb',
  '/gbc',
  '/games/tetris',
  '/news',
  '/achievements',
  '/about',
  '/login',
]
const PRIVATE = [
  '/',
  '/collection',
  '/collection?view=table',
  '/wishlist',
  '/stats',
  '/achievements',
  '/settings',
  '/games/tetris',
]

async function scan(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
  const res = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return res.violations.map((v) => `${url}: ${v.id} (${v.nodes.length})`)
}

for (const theme of ['dark', 'light'] as const) {
  test(`axe: public pages in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('saveslot:theme', t), theme)
    const found: string[] = []
    for (const url of PUBLIC) found.push(...(await scan(page, url)))
    expect(found).toEqual([])
  })

  test(`axe: signed-in pages in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('saveslot:theme', t), theme)
    await page.goto('/login?mode=signup')
    await page.getByRole('tab', { name: 'New save file' }).click()
    await page
      .getByLabel('E-mail')
      .fill(`a11y-${theme}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.test`)
    await page.getByLabel('Password').fill('press-start-123')
    await page.getByRole('button', { name: 'Create save file' }).click()
    await expect(page).toHaveURL(/\/collection$/)
    await page.goto('/games/tetris')
    await page.locator('#your-copies').getByRole('button', { name: 'Add to collection' }).click()
    await expect(page.getByText(/IN YOUR COLLECTION · /)).toBeVisible()
    const found: string[] = []
    for (const url of PRIVATE) found.push(...(await scan(page, url)))
    expect(found).toEqual([])
  })
}
