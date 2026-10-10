import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function signUp(page: Page) {
  await page.goto('/login?mode=signup')
  await page.getByRole('tab', { name: 'New save file' }).click()
  await page
    .getByLabel('E-mail')
    .fill(`a-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`)
  await page.getByLabel('Password').fill('press-start-123')
  await page.getByRole('button', { name: 'Create save file' }).click()
  await expect(page).toHaveURL(/\/collection$/)
}

const toast = (page: Page) => page.getByRole('status').filter({ hasText: 'ACHIEVEMENT UNLOCKED' })

test('full loop: search → add → completion → wishlist → GOT IT → achievements', async ({
  page,
}) => {
  await signUp(page)

  // Search and open a game
  await page.goto('/games?q=tetris')
  await page
    .getByRole('link', { name: /^Tetris,/ })
    .first()
    .click()
  await expect(page).toHaveURL(/\/games\/tetris$/)

  // Add to collection → first sticker
  await page.locator('#your-copies').getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByText(/IN YOUR COLLECTION · /)).toBeVisible()
  await expect(toast(page)).toContainText('Insert Cartridge')

  // Completion went up
  await page.goto('/collection')
  await expect(page.getByRole('progressbar', { name: 'Game Boy', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '1',
  )

  // Wishlist → GOT IT → Wish Granted
  await page.goto('/games/shantae')
  await page.getByRole('button', { name: '♡ Wishlist' }).click()
  await expect(page.getByRole('button', { name: '♥ On wishlist' })).toBeVisible()
  await page.goto('/wishlist')
  await page.getByRole('button', { name: 'Got it!' }).click()
  await page.getByRole('button', { name: 'Add & remove from wishlist' }).click()
  await expect(page.getByText('NO WISHES YET')).toBeVisible()
  await expect(toast(page)).toContainText('Wish Granted')

  // The sticker sheet shows them in colour, the rest locked
  await page.goto('/achievements')
  const sheet = page.getByRole('list', { name: 'Sticker sheet' })
  await expect(sheet.getByText('Insert Cartridge')).toBeVisible()
  await expect(sheet.getByText('Wish Granted')).toBeVisible()
  await expect(sheet.getByText('Window Shopper')).toBeVisible()
  await expect(sheet.getByText('Locked achievement').first()).toBeAttached()
  const progress = page.getByRole('progressbar', { name: 'Stickers collected' })
  expect(Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(3)

  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  expect(axe.violations).toEqual([])

  // Home lists them under recent achievements
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Recent achievements' })).toBeVisible()
})

test('achievements page works signed out', async ({ page }) => {
  await page.goto('/achievements')
  await expect(page.getByRole('heading', { name: 'PRESS START TO COLLECT' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Sticker sheet' }).getByRole('listitem')).toHaveCount(
    31,
  )
})

test('404 is a GAME OVER screen', async ({ page }) => {
  const res = await page.goto('/this-cartridge-does-not-exist')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { name: 'GAME OVER' })).toBeVisible()
  await expect(page.getByText('ERROR 404')).toBeVisible()
  await page.getByRole('link', { name: 'Browse games' }).click()
  await expect(page).toHaveURL(/\/games$/)
})

test('sound effects are off by default and can be switched on', async ({ page }) => {
  await page.goto('/')
  const toggle = page.getByRole('switch', { name: 'Sound effects' })
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-sound', 'on')
  await page.reload()
  await expect(page.getByRole('switch', { name: 'Sound effects' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
})
