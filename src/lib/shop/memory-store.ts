import 'server-only'
import { randomUUID } from 'node:crypto'
import { extFor } from '@/lib/backend/limits'
import type {
  Category,
  NewOrder,
  NewRepair,
  Order,
  OrderStatus,
  Photo,
  Product,
  ProductInput,
  ProductQuery,
  RepairCatalog,
  RepairNote,
  RepairPrice,
  RepairRequest,
  RepairStatus,
  ShopStore,
} from './types'
import { estimateFor, referenceNumber, REPAIR_DEVICES, REPAIR_ISSUES } from './util'

/**
 * In-process shop storage for local development and e2e tests only (never production: the
 * backend selector refuses it there). Starts with an empty catalogue, like production.
 */
type ProductRow = Omit<Product, 'categoryName' | 'images'> & {
  images: { id: string; path: string; alt: string | null }[]
}
type State = {
  categories: Category[]
  products: ProductRow[]
  files: Map<string, Photo>
  orders: (Order & { tokenHash: string })[]
  catalog: RepairCatalog
  repairs: (RepairRequest & { tokenHash: string })[]
  notes: Map<string, RepairNote[]>
}

const g = globalThis as unknown as { __saveslotShop?: State }
const fresh = (): State => ({
  categories: [],
  products: [],
  files: new Map(),
  orders: [],
  catalog: {
    devices: REPAIR_DEVICES.map((d, i) => ({
      id: `dev:${d.slug}`,
      slug: d.slug,
      name: d.name,
      sort: i,
    })),
    issues: REPAIR_ISSUES.map((x, i) => ({ id: `iss:${x.slug}`, ...x, sort: i })),
    prices: [],
  },
  repairs: [],
  notes: new Map(),
})
const s: State = (g.__saveslotShop ??= fresh())

export function resetMemoryShop() {
  Object.assign(s, fresh())
}

const imageUrl = (path: string) => `/shop/image?path=${encodeURIComponent(path)}`

function hydrate(p: ProductRow): Product {
  return {
    ...p,
    categoryName: s.categories.find((c) => c.id === p.categoryId)?.name ?? null,
    images: p.images.map((i) => ({ ...i, url: imageUrl(i.path) })),
  }
}

const norm = (v: string) => v.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()

function sortProducts(list: Product[], sort: ProductQuery['sort']) {
  const by = {
    newest: (a: Product, b: Product) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a: Product, b: Product) => a.priceCents - b.priceCents,
    price_desc: (a: Product, b: Product) => b.priceCents - a.priceCents,
    name: (a: Product, b: Product) => a.name.localeCompare(b.name),
  }[sort]
  return [...list].sort(by)
}

const ok = <T>(data: T) => ({ ok: true as const, data })
const fail = (error: string) => ({ ok: false as const, error })

export const memoryShopStore: ShopStore = {
  async listCategories() {
    return [...s.categories].sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name))
  },
  async listProducts(q, opts) {
    const words = q.q ? norm(q.q).split(/\s+/).filter(Boolean) : []
    const cat = q.category ? s.categories.find((c) => c.slug === q.category) : undefined
    let list = s.products
      .filter((p) => opts?.includeInactive || p.active)
      .filter((p) => !q.category || p.categoryId === cat?.id)
      .filter((p) => !q.condition || p.condition === q.condition)
      .filter((p) => !q.inStock || p.stock > 0)
      .filter((p) => words.every((w) => norm(`${p.name} ${p.description}`).includes(w)))
      .map(hydrate)
    list = sortProducts(list, q.sort)
    const start = (q.page - 1) * q.pageSize
    return { items: list.slice(start, start + q.pageSize), total: list.length }
  },
  async getProduct(slug, opts) {
    const p = s.products.find((x) => x.slug === slug && (opts?.includeInactive || x.active))
    return p ? hydrate(p) : null
  },
  async getProductsByIds(ids) {
    return s.products.filter((p) => ids.includes(p.id)).map(hydrate)
  },
  async getProductById(id) {
    const p = s.products.find((x) => x.id === id)
    return p ? hydrate(p) : null
  },
  async saveProduct(id, input: ProductInput) {
    if (s.products.some((p) => p.slug === input.slug && p.id !== id)) {
      return fail('That URL slug is already used by another product.')
    }
    if (id) {
      const row = s.products.find((p) => p.id === id)
      if (!row) return fail('Product not found.')
      Object.assign(row, input)
      return ok({ id })
    }
    const row: ProductRow = {
      ...input,
      id: randomUUID(),
      images: [],
      createdAt: new Date().toISOString(),
    }
    s.products.push(row)
    return ok({ id: row.id })
  },
  async deleteProduct(id) {
    const row = s.products.find((p) => p.id === id)
    if (!row) return fail('Product not found.')
    for (const i of row.images) s.files.delete(`product:${i.path}`)
    s.products = s.products.filter((p) => p.id !== id)
    // Order lines keep their name/price snapshot.
    for (const o of s.orders) for (const it of o.items) if (it.productId === id) it.productId = null
    return ok(undefined)
  },
  async saveCategory({ slug, name }) {
    const existing = s.categories.find((c) => c.slug === slug)
    if (existing) existing.name = name
    else s.categories.push({ id: randomUUID(), slug, name, sort: s.categories.length })
    return ok(undefined)
  },
  async addProductImage(productId, photo, alt) {
    const row = s.products.find((p) => p.id === productId)
    if (!row) return fail('Product not found.')
    if (row.images.length >= 8) return fail('Max 8 images per product.')
    const path = `${productId}/${randomUUID()}.${extFor(photo.contentType)}`
    s.files.set(`product:${path}`, photo)
    row.images.push({ id: randomUUID(), path, alt })
    return ok(undefined)
  },
  async removeProductImage(imageId) {
    for (const p of s.products) {
      const img = p.images.find((i) => i.id === imageId)
      if (img) {
        p.images = p.images.filter((i) => i.id !== imageId)
        s.files.delete(`product:${img.path}`)
        return ok(undefined)
      }
    }
    return fail('Image not found.')
  },
  async readProductImage(path) {
    return s.files.get(`product:${path}`) ?? null
  },

  async createOrder(order: NewOrder, tokenHash) {
    let number = referenceNumber('SS')
    while (s.orders.some((o) => o.number === number)) number = referenceNumber('SS')
    const row = {
      ...order,
      id: randomUUID(),
      number,
      status: 'pending_payment' as OrderStatus,
      molliePaymentId: null,
      needsAttention: null,
      createdAt: new Date().toISOString(),
      paidAt: null,
      tokenHash,
    }
    s.orders.push(row)
    return ok({ id: row.id, number })
  },
  async attachPayment(orderId, paymentId) {
    const o = s.orders.find((x) => x.id === orderId)
    if (o) o.molliePaymentId = paymentId
  },
  async getOrderByNumber(number) {
    return s.orders.find((o) => o.number === number) ?? null
  },
  async getOrderByPayment(paymentId) {
    return s.orders.find((o) => o.molliePaymentId === paymentId) ?? null
  },
  async markOrderPaid(orderId) {
    const o = s.orders.find((x) => x.id === orderId)
    if (!o) return { alreadyPaid: false, shortage: 'order not found' }
    if (o.paidAt) return { alreadyPaid: true, shortage: null }
    const short: string[] = []
    for (const it of o.items) {
      const p = s.products.find((x) => x.id === it.productId)
      if (!p || p.stock < it.quantity) short.push(it.name)
      if (p) p.stock = Math.max(0, p.stock - it.quantity)
    }
    o.status = 'paid'
    o.paidAt = new Date().toISOString()
    o.needsAttention = short.length ? `Not enough stock for: ${short.join(', ')}` : null
    return { alreadyPaid: false, shortage: o.needsAttention }
  },
  async setOrderStatus(orderId, status) {
    const o = s.orders.find((x) => x.id === orderId)
    if (!o) return fail('Order not found.')
    o.status = status
    return ok(undefined)
  },
  async listOrders({ status, limit }) {
    return s.orders
      .filter((o) => !status || o.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  },
  async getOrder(id) {
    return s.orders.find((o) => o.id === id) ?? null
  },

  async repairCatalog() {
    return structuredClone(s.catalog)
  },
  async setRepairPrice(price: RepairPrice) {
    s.catalog.prices = s.catalog.prices.filter(
      (p) => !(p.deviceId === price.deviceId && p.issueId === price.issueId),
    )
    s.catalog.prices.push(price)
    return ok(undefined)
  },
  async createRepair(input: NewRepair, photos, tokenHash) {
    const device = s.catalog.devices.find((d) => d.id === input.deviceId)
    const issue = s.catalog.issues.find((i) => i.id === input.issueId)
    if (!device || !issue) return fail('Choose a device and a problem.')
    let number = referenceNumber('RS')
    while (s.repairs.some((r) => r.number === number)) number = referenceNumber('RS')
    const id = randomUUID()
    const photoPaths = photos.map((p) => {
      const path = `${id}/${randomUUID()}.${extFor(p.contentType)}`
      s.files.set(`repair:${path}`, p)
      return path
    })
    const now = new Date().toISOString()
    s.repairs.push({
      ...input,
      id,
      number,
      deviceName: device.name,
      issueName: issue.name,
      status: 'received',
      estimate: estimateFor(s.catalog, device.id, issue.id),
      finalPriceCents: null,
      photoPaths,
      events: [{ status: 'received', note: null, createdAt: now }],
      createdAt: now,
      updatedAt: now,
      tokenHash,
    })
    return ok({ id, number })
  },
  async getRepairByNumber(number) {
    return s.repairs.find((r) => r.number === number) ?? null
  },
  async listRepairs({ status, open, limit }) {
    return s.repairs
      .filter((r) => !status || r.status === status)
      .filter((r) => !open || r.status !== 'ready_or_shipped')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  },
  async getRepair(id) {
    return s.repairs.find((r) => r.id === id) ?? null
  },
  async updateRepairStatus(id, status: RepairStatus, note) {
    const r = s.repairs.find((x) => x.id === id)
    if (!r) return fail('Repair not found.')
    const now = new Date().toISOString()
    r.status = status
    r.updatedAt = now
    r.events.push({ status, note, createdAt: now })
    return ok(undefined)
  },
  async setRepairFinalPrice(id, cents) {
    const r = s.repairs.find((x) => x.id === id)
    if (!r) return fail('Repair not found.')
    r.finalPriceCents = cents
    r.updatedAt = new Date().toISOString()
    return ok(undefined)
  },
  async addRepairNote(id, body, author) {
    if (!s.repairs.some((r) => r.id === id)) return fail('Repair not found.')
    const list = s.notes.get(id) ?? []
    list.push({ id: randomUUID(), body, author, createdAt: new Date().toISOString() })
    s.notes.set(id, list)
    return ok(undefined)
  },
  async listRepairNotes(id) {
    return [...(s.notes.get(id) ?? [])].reverse()
  },
  async readRepairPhoto(path) {
    return s.files.get(`repair:${path}`) ?? null
  },
}
