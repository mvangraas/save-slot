import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('lists the whole catalogue with pagination', async ({ page }) => {
  await page.goto('/games')
  await expect(page.getByText('39 GAMES')).toBeVisible()
  await page.getByRole('link', { name: 'Page 2' }).click()
  await expect(page).toHaveURL(/page=2/)
  await expect(page.getByText(/page 2 of 2/)).toBeVisible()
})

test('search by text, with accents optional', async ({ page }) => {
  await page.goto('/games')
  const box = page.getByRole('combobox', { name: 'Search games' })
  await box.fill('pokemon')
  await box.press('Enter')
  await expect(page).toHaveURL(/q=pokemon/)
  await expect(page.getByText('8 GAMES')).toBeVisible()
  await expect(page.getByRole('link', { name: /Pokémon Crystal/ })).toBeVisible()
})

test('autocomplete opens a game', async ({ page }) => {
  await page.goto('/games')
  const box = page.getByRole('combobox', { name: 'Search games' })
  await box.pressSequentially('wario land 3', { delay: 20 })
  const option = page.getByRole('option', { name: /Wario Land 3/ })
  await expect(option).toBeVisible()
  await box.press('ArrowDown')
  await box.press('Enter')
  await expect(page).toHaveURL(/\/games\/wario-land-3$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Wario Land 3' })).toBeVisible()
})

test('filters apply immediately and can be removed as chips', async ({ page }) => {
  await page.goto('/games')
  await page.getByText('Filters').click()
  await page.getByRole('checkbox', { name: 'Japan' }).check()
  await expect(page).toHaveURL(/region=jp/)
  await page.getByRole('checkbox', { name: /^RPG/ }).check()
  await expect(page).toHaveURL(/genre=rpg/)
  await expect(page.getByText('8 GAMES')).toBeVisible()

  await page
    .getByRole('group', { name: 'Active filters' })
    .getByRole('link', { name: /Japan/ })
    .click()
  await expect(page).not.toHaveURL(/region=jp/)
  await expect(page).toHaveURL(/genre=rpg/)
})

test('index view shows a table', async ({ page }) => {
  await page.goto('/games?genre=rpg&view=list')
  await expect(page.getByRole('table')).toBeVisible()
  await expect(page.getByRole('rowheader', { name: /Pokémon Gold/ })).toBeVisible()
})

test('platform hubs are scoped', async ({ page }) => {
  await page.goto('/gbc')
  await expect(page.getByRole('heading', { level: 1, name: 'GAME BOY COLOR' })).toBeVisible()
  await expect(page.getByText('15 GAMES', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tetris, Game Boy,/ })).toHaveCount(0)
})

test('game detail page shows releases per region', async ({ page }) => {
  await page.goto('/games/pokemon-gold')
  await expect(page.getByRole('heading', { level: 1, name: 'Pokémon Gold' })).toBeVisible()
  const releases = page.getByRole('table', { name: /Releases of Pokémon Gold/ })
  await expect(releases.getByRole('row')).toHaveCount(4)
  await expect(releases.getByText('Pocket Monsters Kin')).toBeVisible()
  await expect(page.getByRole('heading', { name: /MORE FROM POKÉMON/ })).toBeVisible()
})

test('unknown game shows GAME OVER', async ({ page }) => {
  await page.goto('/games/this-game-does-not-exist')
  await expect(page.getByRole('heading', { name: 'GAME OVER' })).toBeVisible()
})

for (const path of ['/games', '/games?region=jp&view=list', '/gbc', '/games/pokemon-gold']) {
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
