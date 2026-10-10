import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home shows the hero, both platforms and the disclaimer', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('YOUR GAME BOY')
  await expect(page.getByText('Rediscover the games that started it all.')).toBeVisible()
  await expect(page.getByRole('link', { name: /GAME BOY COLOR/ })).toBeVisible()
  await expect(
    page.getByText(/not affiliated with, endorsed or sponsored by Nintendo/),
  ).toBeVisible()
})

test('unknown routes show GAME OVER with a 404 status', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'GAME OVER' })).toBeVisible()
})

test('theme toggle switches and persists', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  const before = await html.getAttribute('data-theme')
  await page.getByRole('button', { name: 'Light mode' }).click()
  const after = before === 'light' ? 'dark' : 'light'
  await expect(html).toHaveAttribute('data-theme', after)
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', after)
})

test('reduce effects toggle sets the html flag', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('switch', { name: 'Reduce effects' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-effects', 'reduced')
})

test('navigation marks the current page', async ({ page }) => {
  // A public page: signed-out visits to /wishlist redirect to /login, which raced this check.
  await page.goto('/games')
  const name = 'Games'
  await expect(page.getByRole('link', { name, exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
})

test('component preview renders in both themes', async ({ page }) => {
  for (const theme of ['dark', 'light']) {
    await page.addInitScript((t) => localStorage.setItem('saveslot:theme', t), theme)
    await page.goto('/dev/components')
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await expect(page.getByRole('heading', { name: 'COMPONENTS' })).toBeVisible()
  }
})

for (const path of ['/', '/dev/components', '/about']) {
  test(`no axe violations on ${path}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(
      results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
    ).toEqual([])
  })
}
