import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Browser, type Page } from '@playwright/test'

// One server (in-memory store) is shared by desktop + mobile projects, so each run uses
// unique names and the flow runs serially.
test.describe.configure({ mode: 'serial', timeout: 120_000 })

const PASSWORD = 'press-start-123'
const run = Math.random().toString(36).slice(2, 7)

async function signUp(page: Page, email: string) {
  await page.goto('/login?mode=signup')
  await page.getByRole('tab', { name: 'New save file' }).click()
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create save file' }).click()
  await expect(page).toHaveURL(/\/collection$/)
}

async function adminPage(browser: Browser) {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  // admin@example.test is the only admin (ADMIN_EMAILS): create it once, sign in afterwards.
  await page.goto('/login?mode=signup')
  await page.getByRole('tab', { name: 'New save file' }).click()
  await page.getByLabel('E-mail').fill('admin@example.test')
  await page.getByLabel('Password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Create save file' }).click()
  const exists = page.getByText('An account with this e-mail already exists.')
  await expect(exists.or(page.getByRole('heading', { name: 'MY COLLECTION' }))).toBeVisible()
  if (await exists.isVisible()) {
    await page.getByRole('tab', { name: 'Sign in' }).click()
    await page.getByLabel('E-mail').fill('admin@example.test')
    await page.getByLabel('Password').fill(PASSWORD)
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page).not.toHaveURL(/\/login/)
  }
  return page
}

test('shop + repairs: full customer and admin flow', async ({ page, browser }, info) => {
  const name = `Test Cartridge ${run}-${info.project.name}`
  const slug = `test-cartridge-${run}-${info.project.name}`
  const admin = await adminPage(browser)

  // --- Admin creates a category and a product (starts hidden), then publishes it
  await admin.goto('/admin/products')
  await admin.getByLabel('Category name').fill(`Games ${run}`)
  await admin.getByLabel('Slug').fill(`games-${run}-${info.project.name}`)
  await admin.getByRole('button', { name: 'Add category' }).click()
  await expect(admin.getByText('CATEGORY SAVED')).toBeVisible()

  await admin.goto('/admin/products/new')
  await admin.getByLabel('Name', { exact: true }).fill(name)
  await admin.getByLabel('URL slug').fill(slug)
  await admin.getByLabel(/^Price/).fill('24,50')
  await admin.getByLabel('Stock').fill('2')
  await admin.getByLabel('Category').selectOption({ label: `Games ${run}` })
  await admin.getByLabel('Description').fill('Tested cartridge, label in good shape.')
  await admin.getByLabel('Specifications').fill('Region: PAL\nBattery: replaced')
  await admin.getByRole('button', { name: 'Create product' }).click()
  await expect(admin).toHaveURL(/\/admin\/products\/[\w-]+\?created=1/)
  await admin.getByLabel('Add photo').setInputFiles('e2e/fixtures/cartridge-photo.jpg')
  await admin.getByRole('button', { name: 'Upload' }).click()
  await expect(admin.getByText('IMAGE ADDED')).toBeVisible()
  await admin.getByRole('checkbox', { name: 'Visible in the shop' }).check()
  await admin.getByRole('button', { name: 'Save product' }).click()
  await expect(admin.getByText('PRODUCT SAVED')).toBeVisible()

  // --- 1. Customer finds and views the product
  await page.goto(`/shop?q=${encodeURIComponent(run)}`)
  await page.getByRole('link', { name }).click()
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible()
  await expect(page.getByText('€24.50').first()).toBeVisible()
  await expect(page.getByText('Only 2 left').first()).toBeVisible()
  await expect(page.getByText('Battery', { exact: true })).toBeVisible()

  // --- 2. Adds it to the cart (2 pieces)
  await page.getByLabel('Quantity').selectOption('2')
  await page.getByRole('button', { name: 'Add to cart' }).click()
  await expect(page.getByRole('link', { name: /Cart, 2 items/ })).toBeVisible()
  await page.goto('/shop/cart')
  await expect(page.getByRole('list', { name: 'Items in your cart' })).toContainText(name)
  await expect(page.getByText('€49.00').first()).toBeVisible()

  // --- 3. Checkout → (mock) Mollie → confirmation
  await page.getByRole('link', { name: 'Order now' }).click()
  await page.getByLabel('Full name').fill('Test Customer')
  await page.getByLabel('E-mail').fill(`buyer-${run}@example.test`)
  await page.getByLabel('Street').fill('Teststraat')
  await page.getByLabel('House number').fill('1')
  await page.getByLabel('Postcode').fill('1234 AB')
  await page.getByLabel('City').fill('Testdorp')
  await page.getByRole('button', { name: 'Order and pay' }).click()
  await expect(page.getByText('Please accept the terms and conditions.')).toBeVisible()
  await page.getByRole('checkbox', { name: /I accept the/ }).check()
  await page.getByRole('button', { name: 'Order and pay' }).click()
  await expect(page.getByRole('heading', { name: /Mock payment 53\.95 EUR/ })).toBeVisible()
  await page.getByRole('button', { name: 'Pay', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ORDER CONFIRMED' })).toBeVisible()
  const orderNumber = (await page.locator('strong.font-mono').first().textContent())!.trim()
  expect(orderNumber).toMatch(/^SS-/)
  await expect(page.getByRole('link', { name: 'Cart, empty' })).toBeVisible()

  // Stock was taken: product is sold out now
  await page.goto(`/shop/${slug}`)
  await expect(page.getByText('Sold out').first()).toBeVisible()

  // Admin sees the paid order and ships it
  await admin.goto('/admin/orders?status=paid')
  await admin.getByRole('link', { name: orderNumber }).click()
  await expect(admin.getByText('Status: Paid')).toBeVisible()
  await admin.getByLabel('Change status').selectOption('shipped')
  await admin.getByRole('button', { name: 'Update' }).click()
  await expect(admin.getByText('Status: Shipped')).toBeVisible()

  // --- 4. Customer requests a repair
  await page.goto('/repairs')
  await expect(page.getByRole('heading', { name: 'REPAIR SERVICE' })).toBeVisible()
  const form = page.locator('#request')
  await form.getByRole('radio', { name: 'Game Boy Pocket' }).check()
  await form.getByLabel('What is wrong?').selectOption({ label: 'Screen or screen lens' })
  await expect(form.locator('[aria-live="polite"]')).toContainText('Price indication: on request')
  await form.getByLabel('Describe the problem').fill('The screen has two missing vertical lines.')
  await form.getByLabel(/Photos of the defect/).setInputFiles('e2e/fixtures/cartridge-photo.jpg')
  await form.getByRole('radio', { name: 'Send it by post' }).check()
  await form.getByLabel('Name').fill('Repair Customer')
  await form.getByLabel('E-mail').fill(`repair-${run}@example.test`)
  await form.getByLabel('Phone').fill('0612345678')
  await form.getByRole('button', { name: 'Request a repair' }).click()
  await expect(form.getByText('Please agree to the privacy statement.')).toBeVisible()
  await form.getByRole('checkbox', { name: /I agree/ }).check()
  await form.getByRole('button', { name: 'Request a repair' }).click()
  await expect(page.getByRole('heading', { name: 'REQUEST RECEIVED' })).toBeVisible()
  const repairNumber = (await page.locator('p.font-pixel').first().textContent())!.trim()
  expect(repairNumber).toMatch(/^RS-/)
  await expect(page.locator('[aria-current="step"]')).toContainText('Request received')

  // --- 5. Admin processes it: status + public note + final price + internal note
  await admin.goto('/admin/repairs?open=1')
  await admin.getByRole('link', { name: repairNumber }).click()
  await expect(admin.getByRole('img', { name: 'Customer photo 1' })).toBeVisible()
  await admin.getByLabel('New status').selectOption('waiting_parts')
  await admin.getByLabel(/Message for the customer/).fill('New screen ordered, arrives Friday.')
  await admin.getByRole('button', { name: 'Update status' }).click()
  await expect(admin.getByText('STATUS UPDATED')).toBeVisible()
  await admin.getByLabel('Final price (€)').fill('39,95')
  await admin.getByRole('button', { name: 'Save price' }).click()
  await expect(admin.getByText('PRICE SAVED')).toBeVisible()
  await admin.getByRole('textbox', { name: /Internal note/ }).fill('Customer prefers a call.')
  await admin.getByRole('button', { name: 'Add note' }).click()
  await expect(admin.getByText('NOTE ADDED')).toBeVisible()

  // --- 6. Customer looks up the status with number + e-mail
  await page.goto('/repairs/status')
  await page.getByLabel('Repair number').fill(repairNumber)
  await page.getByLabel('E-mail used for the request').fill(`wrong-${run}@example.test`)
  await page.getByRole('button', { name: 'Show status' }).click()
  await expect(page.getByText('No repair found with that number and e-mail address.')).toBeVisible()
  await page.getByLabel('E-mail used for the request').fill(`repair-${run}@example.test`)
  await page.getByRole('button', { name: 'Show status' }).click()
  await expect(page.locator('[aria-current="step"]')).toContainText('Waiting for parts')
  await expect(page.getByText('New screen ordered, arrives Friday.')).toBeVisible()
  await expect(page.getByText('€39.95')).toBeVisible()
  await expect(page.getByText('Customer prefers a call.')).toHaveCount(0)

  await admin.context().close()
})

test('7. non-admins cannot reach admin pages or files', async ({ page, request }) => {
  // Signed out → login
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin/)
  // Signed in, not an admin → 404
  await signUp(page, `visitor-${run}-${Math.random().toString(36).slice(2, 6)}@example.test`)
  for (const url of ['/admin', '/admin/orders', '/admin/repairs', '/admin/products/new']) {
    await page.goto(url)
    await expect(page.getByText('ERROR 404'), url).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /DASHBOARD|ORDERS|REPAIRS|NEW PRODUCT/ }),
    ).toHaveCount(0)
  }
  expect((await page.request.get('/admin/repairs/photo?path=a/b.webp')).status()).toBe(404)
  expect((await request.get('/admin/repairs/photo?path=a/b.webp')).status()).toBe(404)
})

test('shop pages are accessible and empty states work', async ({ page }) => {
  await page.goto(`/shop?q=nothing-matches-${run}`)
  await expect(page.getByText('NO MATCHES')).toBeVisible()
  await page.goto('/shop/cart')
  await page.evaluate(() => localStorage.removeItem('saveslot:cart'))
  await page.reload()
  await expect(page.getByText('YOUR CART IS EMPTY')).toBeVisible()
  for (const url of [
    '/shop',
    '/shop/cart',
    '/repairs',
    '/repairs/status',
    '/contact',
    '/legal/terms',
  ]) {
    await page.goto(url)
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(axe.violations.map((v) => `${url}: ${v.id}`)).toEqual([])
  }
})

test('mollie webhook ignores unknown or forged ids', async ({ request }) => {
  const forged = await request.post('/api/mollie/webhook', { form: { id: 'tr_doesnotexist' } })
  expect(forged.status()).toBe(200)
  const junk = await request.post('/api/mollie/webhook', { form: { id: '<script>' } })
  expect(junk.status()).toBe(200)
})
