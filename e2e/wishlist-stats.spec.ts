import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const PASSWORD = 'press-start-123'
async function signUp(page: Page) {
  await page.goto('/login?mode=signup')
  await page.getByRole('tab', { name: 'New save file' }).click()
  await page
    .getByLabel('E-mail')
    .fill(`p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create save file' }).click()
  await expect(page).toHaveURL(/\/collection$/)
}
async function addCopy(page: Page, slug: string) {
  await page.goto(`/games/${slug}`)
  await page.locator('#your-copies').getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByText(/IN YOUR COLLECTION · /)).toBeVisible()
}

test('game page shows demo price estimates', async ({ page }) => {
  await page.goto('/games/tetris')
  const value = page.locator('#value')
  await expect(value.getByText('Demo prices — not real market data')).toBeVisible()
  await expect(
    value.getByRole('table', { name: /Estimated value of Tetris/ }).getByRole('row'),
  ).toHaveCount(4)
})

test('wishlist: add, edit, bargain flag, GOT IT! moves it to the collection', async ({ page }) => {
  await signUp(page)
  await page.goto('/wishlist')
  await expect(page.getByText('NO WISHES YET')).toBeVisible()

  await page.goto('/games/wario-land-3')
  await page.getByRole('button', { name: '♡ Wishlist' }).click()
  await expect(page.getByRole('button', { name: '♥ On wishlist' })).toBeVisible()

  await page.goto('/wishlist')
  await expect(page.getByRole('heading', { name: 'Wario Land 3' })).toBeVisible()
  await expect(page.getByText('Below your max')).toHaveCount(0)

  // Set a generous max price → bargain sticker
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByLabel('Priority').selectOption('high')
  await page.getByLabel('Region').selectOption('eu')
  await page.getByLabel('Max price (€)').fill('500')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('High priority')).toBeVisible()
  await expect(page.getByText('Below your max')).toBeVisible()
  await expect(page.getByText('1 BELOW MAX')).toBeVisible()

  // GOT IT! → collection, wishlist empty
  await page.getByRole('button', { name: 'Got it!' }).click()
  await expect(page.getByLabel('Release')).toHaveValue('seed:wario-land-3:eu')
  await page.getByLabel('Paid (€)').fill('40')
  await page.getByRole('button', { name: 'Add & remove from wishlist' }).click()
  await expect(page.getByText('NO WISHES YET')).toBeVisible()
  await page.goto('/collection')
  await expect(
    page
      .getByRole('list', { name: 'Game Boy Color shelf' })
      .getByRole('link', { name: /Wario Land 3/ }),
  ).toBeVisible()
})

test('stats page shows completion, value and charts with table views', async ({ page }) => {
  await signUp(page)
  await page.goto('/stats')
  await expect(page.getByText('NO DATA ON THIS SAVE FILE')).toBeVisible()
  await addCopy(page, 'tetris')
  await addCopy(page, 'pokemon-gold')

  await page.goto('/stats')
  await expect(page.getByRole('progressbar', { name: 'Game Boy', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '1',
  )
  await expect(
    page.getByRole('progressbar', { name: 'Game Boy Color', exact: true }),
  ).toHaveAttribute('aria-valuenow', '1')
  await expect(page.getByText('Demo prices — not real market data')).toBeVisible()
  const years = page.getByRole('region', { name: 'Owned games per release year' })
  await years.getByText('Show as table').click()
  await expect(years.getByRole('rowheader', { name: '1989' })).toBeVisible()
  await expect(years.getByRole('row', { name: /1999/ })).toContainText('1')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([])
})

test('bulk actions in the collection table', async ({ page }) => {
  page.on('dialog', (d) => d.accept())
  await signUp(page)
  await addCopy(page, 'tetris')
  await addCopy(page, 'golf')
  await addCopy(page, 'baseball')

  await page.goto('/collection?view=table')
  await page.getByRole('checkbox', { name: /Select Tetris/ }).check()
  await page.getByRole('checkbox', { name: /Select Golf/ }).check()
  await expect(page.getByText('2 selected')).toBeVisible()
  await page.getByLabel('Bulk action').selectOption('playing')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('2 copies marked as playing.')).toBeVisible()

  await page.getByRole('checkbox', { name: /Select Baseball/ }).check()
  await page.getByLabel('Bulk action').selectOption('to-wishlist')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('1 copy moved to your wishlist.')).toBeVisible()
  await expect(page.getByRole('rowheader', { name: 'Baseball' })).toHaveCount(0)

  await page.goto('/collection?tab=playing')
  await expect(page.getByRole('list', { name: 'Currently playing' }).getByRole('link')).toHaveCount(
    2,
  )
  await page.goto('/wishlist')
  await expect(page.getByRole('heading', { name: 'Baseball' })).toBeVisible()

  await page.goto('/collection?view=table')
  await page.getByRole('checkbox', { name: 'Select all copies' }).check()
  await page.getByLabel('Bulk action').selectOption('remove')
  await page.getByRole('button', { name: 'Apply' }).click()
  // nothing left to list → the empty shelf replaces the table
  await expect(page.getByText('THIS SHELF IS EMPTY')).toBeVisible()
})
