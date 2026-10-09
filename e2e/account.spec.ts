import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Runs against the in-memory backend (SAVESLOT_MEMORY_BACKEND=1). Every test makes its own user.
const newEmail = () => `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`
const PASSWORD = 'press-start-123'

async function signUp(page: Page, email = newEmail()) {
  await page.goto('/login?mode=signup')
  await page.getByRole('tab', { name: 'New save file' }).click()
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create save file' }).click()
  await expect(page).toHaveURL(/\/collection$/)
  return email
}

test('collection requires sign-in and returns you afterwards', async ({ page }) => {
  await page.goto('/collection?tab=gb')
  await expect(page).toHaveURL(/\/login\?next=%2Fcollection%3Ftab%3Dgb/)
  await expect(page.getByRole('heading', { name: 'PRESS START' })).toBeVisible()
})

test('sign-up validates input', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('tab', { name: 'New save file' }).click()
  await page.getByLabel('E-mail').fill('not-an-email')
  await page.getByLabel('Password').fill('short')
  await page.getByRole('button', { name: 'Create save file' }).click()
  await expect(page.getByText('Enter a valid e-mail address.')).toBeVisible()
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible()
})

test('full loop: sign up → add a copy → it appears on the shelf → edit → remove', async ({
  page,
}) => {
  page.on('dialog', (d) => d.accept())
  await signUp(page)
  await expect(page.getByText('NO DATA ON THIS SAVE FILE')).toBeVisible()

  // Add Tetris (EU, boxed, good, €12,50)
  await page.goto('/games/tetris')
  await expect(page.getByText('NOT IN YOUR COLLECTION YET')).toBeVisible()
  const copies = page.locator('#your-copies')
  await copies.getByLabel('Release').selectOption({ label: 'Europe' })
  await copies.getByLabel('Box').check()
  await copies.getByLabel('Condition').selectOption('good')
  await copies.getByLabel('Paid (€)').fill('12,50')
  await copies.getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByText('IN YOUR COLLECTION · 1 COPY')).toBeVisible()
  await expect(copies.getByText('€12.50')).toBeVisible()

  // Rating, play status, favorite, wishlist
  await page.getByLabel('Rating').selectOption('8')
  await expect(page.getByLabel('Rating')).toHaveValue('8')
  await page.getByLabel('Play').selectOption('playing')
  await expect(page.getByLabel('Play')).toHaveValue('playing')
  await page.getByRole('button', { name: '☆ Favorite' }).click()
  await expect(page.getByRole('button', { name: '★ Favorite' })).toBeVisible()
  await expect(page.getByLabel('Rating')).toHaveValue('8') // favorite keeps the score
  await page.getByRole('button', { name: '♡ Wishlist' }).click()
  await expect(page.getByRole('button', { name: '♥ On wishlist' })).toBeVisible()

  // Memory
  await page.getByLabel('Your memory').fill('Played it on the back seat all summer.')
  await page.getByLabel('Year').fill('1991')
  await page.getByRole('button', { name: 'Save memory' }).click()
  await expect(page.getByText('Played it on the back seat all summer.')).toBeVisible()

  // Shelf, completion, playing tab, table
  await page.goto('/collection')
  await expect(
    page.getByRole('list', { name: 'Game Boy shelf' }).getByRole('link', { name: /Tetris/ }),
  ).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Game Boy', exact: true })).toHaveAttribute(
    'aria-valuenow',
    '1',
  )
  await page.getByRole('link', { name: 'Playing' }).click()
  await expect(
    page.getByRole('list', { name: 'Currently playing' }).getByRole('link', { name: /Tetris/ }),
  ).toBeVisible()
  await page.goto('/collection?view=table')
  await expect(page.getByRole('rowheader', { name: 'Tetris' })).toBeVisible()
  await expect(page.getByRole('cell', { name: '€12.50' })).toBeVisible()

  // CSV export
  const csv = await page.request.get('/collection/export')
  expect(csv.status()).toBe(200)
  expect(csv.headers()['content-disposition']).toContain('save-slot-collection')
  expect(await csv.text()).toContain('Tetris,gb,gb,eu')

  // Home shows the cabinet
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /WELCOME BACK/ })).toBeVisible()
  await expect(
    page
      .getByRole('list', { name: 'Your cartridge cabinet' })
      .getByRole('link', { name: /Tetris/ }),
  ).toBeVisible()

  // Edit then remove
  await page.goto('/games/tetris')
  await copies.getByRole('button', { name: 'Edit' }).click()
  await copies.getByLabel('Manual').nth(0).check()
  await copies.getByLabel('Cartridge').nth(0).check()
  await copies.getByRole('button', { name: 'Save changes' }).click()
  await expect(copies.getByText('CIB', { exact: false })).toBeVisible()
  await copies.getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByText('NOT IN YOUR COLLECTION YET')).toBeVisible()
})

test('sign out, wrong password, sign back in keeps your data', async ({ page }) => {
  const email = await signUp(page)
  await page.goto('/games/wario-land-3')
  await page.locator('#your-copies').getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByText('IN YOUR COLLECTION · 1 COPY')).toBeVisible()

  await page.goto('/settings')
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible()

  await page.goto('/login')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Wrong e-mail or password.')).toBeVisible()

  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page).toHaveURL(/\/collection$/)
  await expect(
    page
      .getByRole('list', { name: 'Game Boy Color shelf' })
      .getByRole('link', { name: /Wario Land 3/ }),
  ).toBeVisible()
})

test('users only see their own collection', async ({ page, browser }) => {
  await signUp(page)
  await page.goto('/games/golf')
  await page.locator('#your-copies').getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByText('IN YOUR COLLECTION · 1 COPY')).toBeVisible()

  const other = await browser.newContext()
  const p2 = await other.newPage()
  await signUp(p2)
  await expect(p2.getByText('NO DATA ON THIS SAVE FILE')).toBeVisible()
  await p2.goto('/games/golf')
  await expect(p2.getByText('NOT IN YOUR COLLECTION YET')).toBeVisible()
  await other.close()
})

test('profile settings save and validate', async ({ page }) => {
  await signUp(page)
  await page.goto('/settings')
  const name = `p_${Date.now().toString(36)}`
  await page.getByLabel('Username').fill('NO SPACES!')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('3–24 characters', { exact: false }).last()).toBeVisible()
  await page.getByLabel('Username').fill(name)
  await page.getByLabel('Display name').fill('Merijn')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('PROGRESS SAVED')).toBeVisible()
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'WELCOME BACK, MERIJN' })).toBeVisible()
})

test('export requires sign-in', async ({ request }) => {
  const res = await request.get('/collection/export')
  expect(res.status()).toBe(401)
})

test('signed-out game page invites you to sign in', async ({ page }) => {
  await page.goto('/games/tetris')
  await page.getByRole('link', { name: 'Sign in to collect' }).click()
  await expect(page).toHaveURL(/\/login\?next=%2Fgames%2Ftetris/)
})

test('no axe violations on login, settings, collection and a game with your copy', async ({
  page,
}) => {
  page.on('dialog', (d) => d.accept())
  const scan = async () =>
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)
  await page.goto('/login')
  expect(await scan()).toEqual([])
  await signUp(page)
  await page.goto('/games/pokemon-gold')
  await page.locator('#your-copies').getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByText('IN YOUR COLLECTION · 1 COPY')).toBeVisible()
  expect(await scan()).toEqual([])
  await page.goto('/collection')
  expect(await scan()).toEqual([])
  await page.goto('/collection?view=table')
  expect(await scan()).toEqual([])
  await page.goto('/settings')
  expect(await scan()).toEqual([])
})
