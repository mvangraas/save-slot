import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const PASSWORD = 'press-start-123'
async function signUp(page: Page) {
  const email = `h-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.test`
  await page.goto('/login?mode=signup')
  await page.getByRole('tab', { name: 'New save file' }).click()
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create save file' }).click()
  await expect(page).toHaveURL(/\/collection$/)
  return email
}

test('security headers are set', async ({ request }) => {
  const res = await request.get('/')
  const h = res.headers()
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['x-frame-options']).toBe('DENY')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['x-powered-by']).toBeUndefined()
})

test('photos: upload strips metadata, only the owner can see them, delete works', async ({
  page,
  browser,
}) => {
  await signUp(page)
  await page.goto('/games/tetris')
  await page.locator('#your-copies').getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByText(/IN YOUR COLLECTION · /)).toBeVisible()

  await page
    .getByLabel('Add a photo of your copy')
    .setInputFiles('e2e/fixtures/cartridge-photo.jpg')
  await page.getByRole('button', { name: 'Upload' }).click()
  const img = page.getByRole('img', { name: /Your photo 1 of Tetris/ })
  await expect(img).toBeVisible()
  const src = (await img.getAttribute('src'))!
  const res = await page.request.get(src)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toBe('image/webp')
  const body = await res.body()
  expect(body.includes(Buffer.from('SaveSlotTestCam'))).toBe(false)

  // Someone else (or nobody) can't read it
  const other = await browser.newContext()
  expect((await other.request.get(new URL(src, page.url()).toString())).status()).toBe(404)
  await other.close()

  // Rejects non-images
  await page.getByLabel('Add a photo of your copy').setInputFiles({
    name: 'evil.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('<svg onload=alert(1)>'),
  })
  await page.getByRole('button', { name: 'Upload' }).click()
  await expect(page.getByText('Only JPEG, PNG or WebP photos.')).toBeVisible()

  await page.getByRole('button', { name: 'Delete photo 1' }).click()
  await expect(page.getByRole('img', { name: /Your photo 1 of Tetris/ })).toHaveCount(0)
})

test('data export and account deletion', async ({ page }) => {
  const email = await signUp(page)
  await page.goto('/games/tetris')
  await page.locator('#your-copies').getByRole('button', { name: 'Add to collection' }).click()
  await expect(page.getByText(/IN YOUR COLLECTION · /)).toBeVisible()

  await page.goto('/settings')
  const download = page.waitForEvent('download')
  await page.getByRole('link', { name: 'Download my data (JSON)' }).click()
  const file = await (await download).path()
  const data = JSON.parse(readFileSync(file, 'utf8'))
  expect(data.account.email).toBe(email)
  expect(data.collection).toHaveLength(1)
  expect(data.collection[0].gameTitle).toBe('Tetris')
  expect(data.achievements.map((a: { code: string }) => a.code)).toContain('first_cart')

  // Wrong confirmation does nothing
  await page.getByLabel('Type DELETE to confirm').fill('delete')
  await page.getByRole('button', { name: 'Delete my account forever' }).click()
  await expect(page.getByText('Type DELETE to confirm.')).toBeVisible()

  await page.getByLabel('Type DELETE to confirm').fill('DELETE')
  await page.getByRole('button', { name: 'Delete my account forever' }).click()
  await expect(page.getByRole('heading', { name: 'SAVE FILE ERASED' })).toBeVisible()

  // Signed out, and the account is really gone
  await page.goto('/settings')
  await expect(page).toHaveURL(/\/login/)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Wrong e-mail or password.')).toBeVisible()
})
