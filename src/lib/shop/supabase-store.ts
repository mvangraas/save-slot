import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extFor } from '@/lib/backend/limits'
import type { Database, Json } from '@/lib/supabase/database.types'
import type {
  Address,
  Category,
  Order,
  Product,
  ProductQuery,
  RepairCatalog,
  RepairRequest,
  ShopStore,
} from './types'
import { estimateFor, referenceNumber } from './util'

type DB = SupabaseClient<Database>

const PRODUCT_BUCKET = 'product-images'
const REPAIR_BUCKET = 'repair-photos'

const productSelect =
  `id, slug, name, description, category_id, price_cents, stock, condition, specs,
  active, created_at, category:product_categories ( name ),
  images:product_images ( id, path, alt, sort )` as const

type ProductRow = {
  id: string
  slug: string
  name: string
  description: string
  category_id: string | null
  price_cents: number
  stock: number
  condition: Product['condition']
  specs: Json
  active: boolean
  created_at: string
  category: { name: string } | null
  images: { id: string; path: string; alt: string | null; sort: number }[]
}

const orderSelect = `id, number, user_id, email, name, phone, address, status, subtotal_cents,
  shipping_cents, total_cents, mollie_payment_id, needs_attention, created_at, paid_at, token_hash,
  items:order_items ( product_id, name, unit_price_cents, quantity )` as const

type OrderRow = {
  id: string
  number: string
  user_id: string | null
  email: string
  name: string
  phone: string | null
  address: Json
  status: Order['status']
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  mollie_payment_id: string | null
  needs_attention: string | null
  created_at: string
  paid_at: string | null
  token_hash: string
  items: { product_id: string | null; name: string; unit_price_cents: number; quantity: number }[]
}

const repairSelect = `id, number, user_id, name, email, phone, device_id, issue_id, brand, model,
  serial, description, delivery, preferred_date, status, estimate, final_price_cents, photo_paths,
  created_at, updated_at, token_hash,
  device:repair_devices ( name ), issue:repair_issues ( name ),
  events:repair_events ( status, note, created_at )` as const

type RepairRow = {
  id: string
  number: string
  user_id: string | null
  name: string
  email: string
  phone: string
  device_id: string
  issue_id: string
  brand: string | null
  model: string | null
  serial: string | null
  description: string
  delivery: RepairRequest['delivery']
  preferred_date: string | null
  status: RepairRequest['status']
  estimate: Json
  final_price_cents: number | null
  photo_paths: string[]
  created_at: string
  updated_at: string
  token_hash: string
  device: { name: string } | null
  issue: { name: string } | null
  events: { status: RepairRequest['status']; note: string | null; created_at: string }[]
}

const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

const ok = <T>(data: T) => ({ ok: true as const, data })
const fail = (error: string) => ({ ok: false as const, error })
const dbFail = (what: string, e: { code?: string; message: string }) => {
  console.error(`[shop] ${what}`, e.code, e.message)
  if (e.code === '23505') return fail('That URL slug is already used by another product.')
  return fail('Could not save. Please try again.')
}

function isSpecs(v: Json): v is { label: string; value: string }[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'object' && x !== null && 'label' in x)
}

export function createSupabaseShopStore(read: DB, admin: DB | null): ShopStore {
  const write = () => {
    if (!admin) throw new Error('SUPABASE_SECRET_KEY is not configured')
    return admin
  }
  const publicUrl = (path: string) =>
    read.storage.from(PRODUCT_BUCKET).getPublicUrl(path).data.publicUrl

  const toProduct = (r: ProductRow): Product => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    categoryId: r.category_id,
    categoryName: r.category?.name ?? null,
    priceCents: r.price_cents,
    stock: r.stock,
    condition: r.condition,
    specs: isSpecs(r.specs) ? r.specs : [],
    active: r.active,
    images: [...r.images]
      .sort((a, b) => a.sort - b.sort)
      .map((i) => ({ id: i.id, path: i.path, alt: i.alt, url: publicUrl(i.path) })),
    createdAt: r.created_at,
  })

  const toOrder = (r: OrderRow): Order & { tokenHash: string } => ({
    id: r.id,
    number: r.number,
    userId: r.user_id,
    email: r.email,
    name: r.name,
    phone: r.phone,
    address: r.address as unknown as Address,
    status: r.status,
    items: r.items.map((i) => ({
      productId: i.product_id,
      name: i.name,
      unitPriceCents: i.unit_price_cents,
      quantity: i.quantity,
    })),
    subtotalCents: r.subtotal_cents,
    shippingCents: r.shipping_cents,
    totalCents: r.total_cents,
    molliePaymentId: r.mollie_payment_id,
    needsAttention: r.needs_attention,
    createdAt: r.created_at,
    paidAt: r.paid_at,
    tokenHash: r.token_hash,
  })

  const toRepair = (r: RepairRow): RepairRequest & { tokenHash: string } => ({
    id: r.id,
    number: r.number,
    userId: r.user_id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    deviceId: r.device_id,
    deviceName: r.device?.name ?? '—',
    issueId: r.issue_id,
    issueName: r.issue?.name ?? '—',
    brand: r.brand,
    model: r.model,
    serial: r.serial,
    description: r.description,
    delivery: r.delivery,
    preferredDate: r.preferred_date,
    status: r.status,
    estimate: (r.estimate as RepairRequest['estimate']) ?? null,
    finalPriceCents: r.final_price_cents,
    photoPaths: r.photo_paths,
    events: [...r.events]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((e) => ({ status: e.status, note: e.note, createdAt: e.created_at })),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tokenHash: r.token_hash,
  })

  const store: ShopStore = {
    async listCategories() {
      const { data, error } = await read
        .from('product_categories')
        .select('id, slug, name, sort')
        .order('sort')
        .order('name')
      if (error) throw new Error(`categories: ${error.message}`)
      return data as Category[]
    },

    async listProducts(q: ProductQuery, opts) {
      const db = opts?.includeInactive ? write() : read
      let query = db.from('products').select(productSelect, { count: 'exact' })
      if (!opts?.includeInactive) query = query.eq('active', true)
      if (q.category) {
        const { data: cat } = await read
          .from('product_categories')
          .select('id')
          .eq('slug', q.category)
          .maybeSingle()
        if (!cat) return { items: [], total: 0 }
        query = query.eq('category_id', cat.id)
      }
      if (q.condition) query = query.eq('condition', q.condition)
      if (q.inStock) query = query.gt('stock', 0)
      for (const word of (q.q ?? '').toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6)) {
        query = query.ilike('search_text', `%${word.replace(/[%_\\]/g, (m) => `\\${m}`)}%`)
      }
      const order = {
        newest: ['created_at', false],
        price_asc: ['price_cents', true],
        price_desc: ['price_cents', false],
        name: ['name', true],
      } as const
      const [col, asc] = order[q.sort]
      const from = (q.page - 1) * q.pageSize
      const { data, error, count } = await query
        .order(col, { ascending: asc })
        .range(from, from + q.pageSize - 1)
      if (error) throw new Error(`products: ${error.message}`)
      return { items: (data as unknown as ProductRow[]).map(toProduct), total: count ?? 0 }
    },

    async getProduct(slug, opts) {
      const db = opts?.includeInactive ? write() : read
      let query = db.from('products').select(productSelect).eq('slug', slug)
      if (!opts?.includeInactive) query = query.eq('active', true)
      const { data, error } = await query.maybeSingle()
      if (error) throw new Error(`product: ${error.message}`)
      return data ? toProduct(data as unknown as ProductRow) : null
    },

    async getProductsByIds(input) {
      const ids = input.filter(isUuid)
      if (ids.length === 0) return []
      const { data, error } = await read
        .from('products')
        .select(productSelect)
        .in('id', ids)
        .eq('active', true)
      if (error) throw new Error(`products by id: ${error.message}`)
      return (data as unknown as ProductRow[]).map(toProduct)
    },

    async getProductById(id) {
      if (!isUuid(id)) return null
      const { data, error } = await write()
        .from('products')
        .select(productSelect)
        .eq('id', id)
        .maybeSingle()
      if (error) throw new Error(`product by id: ${error.message}`)
      return data ? toProduct(data as unknown as ProductRow) : null
    },

    async saveProduct(id, input) {
      const row = {
        slug: input.slug,
        name: input.name,
        description: input.description,
        category_id: input.categoryId,
        price_cents: input.priceCents,
        stock: input.stock,
        condition: input.condition,
        specs: input.specs as unknown as Json,
        active: input.active,
      }
      if (id) {
        const { error } = await write().from('products').update(row).eq('id', id)
        return error ? dbFail('update product', error) : ok({ id })
      }
      const { data, error } = await write().from('products').insert(row).select('id').single()
      return error ? dbFail('insert product', error) : ok({ id: data.id })
    },

    async deleteProduct(id) {
      const { data: imgs } = await write()
        .from('product_images')
        .select('path')
        .eq('product_id', id)
      const { error } = await write().from('products').delete().eq('id', id)
      if (error) return dbFail('delete product', error)
      if (imgs?.length)
        await write()
          .storage.from(PRODUCT_BUCKET)
          .remove(imgs.map((i) => i.path))
      return ok(undefined)
    },

    async saveCategory({ slug, name }) {
      const { error } = await write()
        .from('product_categories')
        .upsert({ slug, name }, { onConflict: 'slug' })
      return error ? dbFail('category', error) : ok(undefined)
    },

    async addProductImage(productId, photo, alt) {
      const { count } = await write()
        .from('product_images')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId)
      if ((count ?? 0) >= 8) return fail('Max 8 images per product.')
      const path = `${productId}/${crypto.randomUUID()}.${extFor(photo.contentType)}`
      const up = await write()
        .storage.from(PRODUCT_BUCKET)
        .upload(path, photo.bytes, { contentType: photo.contentType, upsert: false })
      if (up.error) return dbFail('upload product image', up.error)
      const { error } = await write()
        .from('product_images')
        .insert({ product_id: productId, path, alt, sort: count ?? 0 })
      if (error) {
        await write().storage.from(PRODUCT_BUCKET).remove([path])
        return dbFail('product image row', error)
      }
      return ok(undefined)
    },

    async removeProductImage(imageId) {
      const { data, error } = await write()
        .from('product_images')
        .delete()
        .eq('id', imageId)
        .select('path')
        .maybeSingle()
      if (error) return dbFail('remove image', error)
      if (!data) return fail('Image not found.')
      await write().storage.from(PRODUCT_BUCKET).remove([data.path])
      return ok(undefined)
    },

    async readProductImage() {
      return null // public bucket: images are served straight from Supabase Storage
    },

    async createOrder(order, tokenHash) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const number = referenceNumber('SS')
        const { data, error } = await write()
          .from('orders')
          .insert({
            number,
            user_id: order.userId,
            email: order.email,
            name: order.name,
            phone: order.phone,
            address: order.address as unknown as Json,
            subtotal_cents: order.subtotalCents,
            shipping_cents: order.shippingCents,
            total_cents: order.totalCents,
            token_hash: tokenHash,
          })
          .select('id')
          .single()
        if (error?.code === '23505') continue // number collision: try another
        if (error) return dbFail('create order', error)
        const { error: itemsError } = await write()
          .from('order_items')
          .insert(
            order.items.map((i) => ({
              order_id: data.id,
              product_id: i.productId,
              name: i.name,
              unit_price_cents: i.unitPriceCents,
              quantity: i.quantity,
            })),
          )
        if (itemsError) {
          await write().from('orders').delete().eq('id', data.id)
          return dbFail('order items', itemsError)
        }
        return ok({ id: data.id, number })
      }
      return fail('Could not create the order. Please try again.')
    },

    async attachPayment(orderId, paymentId) {
      const { error } = await write()
        .from('orders')
        .update({ mollie_payment_id: paymentId })
        .eq('id', orderId)
      if (error) throw new Error(`attach payment: ${error.message}`)
    },

    async getOrderByNumber(number) {
      const { data, error } = await write()
        .from('orders')
        .select(orderSelect)
        .eq('number', number)
        .maybeSingle()
      if (error) throw new Error(`order: ${error.message}`)
      return data ? toOrder(data as unknown as OrderRow) : null
    },

    async getOrderByPayment(paymentId) {
      const { data, error } = await write()
        .from('orders')
        .select(orderSelect)
        .eq('mollie_payment_id', paymentId)
        .maybeSingle()
      if (error) throw new Error(`order by payment: ${error.message}`)
      return data ? toOrder(data as unknown as OrderRow) : null
    },

    async markOrderPaid(orderId) {
      const { data, error } = await write().rpc('mark_order_paid', { p_order_id: orderId })
      if (error) throw new Error(`mark paid: ${error.message}`)
      const res = data as { alreadyPaid: boolean; shortage: string | null }
      return { alreadyPaid: res.alreadyPaid, shortage: res.shortage }
    },

    async setOrderStatus(orderId, status) {
      const { error } = await write().from('orders').update({ status }).eq('id', orderId)
      return error ? dbFail('order status', error) : ok(undefined)
    },

    async listOrders({ status, limit }) {
      let q = write().from('orders').select(orderSelect)
      if (status) q = q.eq('status', status)
      const { data, error } = await q.order('created_at', { ascending: false }).limit(limit)
      if (error) throw new Error(`orders: ${error.message}`)
      return (data as unknown as OrderRow[]).map(toOrder)
    },

    async getOrder(id) {
      if (!isUuid(id)) return null
      const { data, error } = await write()
        .from('orders')
        .select(orderSelect)
        .eq('id', id)
        .maybeSingle()
      if (error) throw new Error(`order: ${error.message}`)
      return data ? toOrder(data as unknown as OrderRow) : null
    },

    async repairCatalog(): Promise<RepairCatalog> {
      const [devices, issues, prices] = await Promise.all([
        read.from('repair_devices').select('id, slug, name, sort').order('sort'),
        read.from('repair_issues').select('id, slug, name, description, sort').order('sort'),
        read
          .from('repair_prices')
          .select('device_id, issue_id, price_from_cents, price_to_cents, days_min, days_max'),
      ])
      if (devices.error || issues.error || prices.error) {
        throw new Error('repair catalogue could not be loaded')
      }
      return {
        devices: devices.data,
        issues: issues.data,
        prices: prices.data.map((p) => ({
          deviceId: p.device_id,
          issueId: p.issue_id,
          priceFromCents: p.price_from_cents,
          priceToCents: p.price_to_cents,
          daysMin: p.days_min,
          daysMax: p.days_max,
        })),
      }
    },

    async setRepairPrice(p) {
      const { error } = await write().from('repair_prices').upsert({
        device_id: p.deviceId,
        issue_id: p.issueId,
        price_from_cents: p.priceFromCents,
        price_to_cents: p.priceToCents,
        days_min: p.daysMin,
        days_max: p.daysMax,
        updated_at: new Date().toISOString(),
      })
      return error ? dbFail('repair price', error) : ok(undefined)
    },

    async createRepair(input, photos, tokenHash) {
      const catalog = await store.repairCatalog()
      if (!catalog.devices.some((d) => d.id === input.deviceId)) return fail('Choose a device.')
      if (!catalog.issues.some((i) => i.id === input.issueId)) return fail('Choose a problem.')
      const id = crypto.randomUUID()
      const uploaded: string[] = []
      for (const p of photos) {
        const path = `${id}/${crypto.randomUUID()}.${extFor(p.contentType)}`
        const up = await write()
          .storage.from(REPAIR_BUCKET)
          .upload(path, p.bytes, { contentType: p.contentType, upsert: false })
        if (up.error) {
          if (uploaded.length) await write().storage.from(REPAIR_BUCKET).remove(uploaded)
          return dbFail('repair photo', up.error)
        }
        uploaded.push(path)
      }
      for (let attempt = 0; attempt < 5; attempt++) {
        const number = referenceNumber('RS')
        const { error } = await write()
          .from('repair_requests')
          .insert({
            id,
            number,
            user_id: input.userId,
            name: input.name,
            email: input.email,
            phone: input.phone,
            device_id: input.deviceId,
            issue_id: input.issueId,
            brand: input.brand,
            model: input.model,
            serial: input.serial,
            description: input.description,
            delivery: input.delivery,
            preferred_date: input.preferredDate,
            estimate: estimateFor(catalog, input.deviceId, input.issueId) as unknown as Json,
            photo_paths: uploaded,
            token_hash: tokenHash,
          })
        if (error?.code === '23505') continue
        if (error) {
          if (uploaded.length) await write().storage.from(REPAIR_BUCKET).remove(uploaded)
          return dbFail('create repair', error)
        }
        await write().from('repair_events').insert({ request_id: id, status: 'received' })
        return ok({ id, number })
      }
      return fail('Could not save the request. Please try again.')
    },

    async getRepairByNumber(number) {
      const { data, error } = await write()
        .from('repair_requests')
        .select(repairSelect)
        .eq('number', number)
        .maybeSingle()
      if (error) throw new Error(`repair: ${error.message}`)
      return data ? toRepair(data as unknown as RepairRow) : null
    },

    async listRepairs({ status, open, limit }) {
      let q = write().from('repair_requests').select(repairSelect)
      if (status) q = q.eq('status', status)
      if (open) q = q.neq('status', 'ready_or_shipped')
      const { data, error } = await q.order('created_at', { ascending: false }).limit(limit)
      if (error) throw new Error(`repairs: ${error.message}`)
      return (data as unknown as RepairRow[]).map(toRepair)
    },

    async getRepair(id) {
      if (!isUuid(id)) return null
      const { data, error } = await write()
        .from('repair_requests')
        .select(repairSelect)
        .eq('id', id)
        .maybeSingle()
      if (error) throw new Error(`repair: ${error.message}`)
      return data ? toRepair(data as unknown as RepairRow) : null
    },

    async updateRepairStatus(id, status, note) {
      const { error } = await write().from('repair_requests').update({ status }).eq('id', id)
      if (error) return dbFail('repair status', error)
      const { error: evError } = await write()
        .from('repair_events')
        .insert({ request_id: id, status, note })
      return evError ? dbFail('repair event', evError) : ok(undefined)
    },

    async setRepairFinalPrice(id, cents) {
      const { error } = await write()
        .from('repair_requests')
        .update({ final_price_cents: cents })
        .eq('id', id)
      return error ? dbFail('final price', error) : ok(undefined)
    },

    async addRepairNote(id, body, author) {
      const { error } = await write().from('repair_notes').insert({ request_id: id, body, author })
      return error ? dbFail('repair note', error) : ok(undefined)
    },

    async listRepairNotes(id) {
      const { data, error } = await write()
        .from('repair_notes')
        .select('id, body, author, created_at')
        .eq('request_id', id)
        .order('created_at', { ascending: false })
      if (error) throw new Error(`notes: ${error.message}`)
      return data.map((n) => ({
        id: n.id,
        body: n.body,
        author: n.author,
        createdAt: n.created_at,
      }))
    },

    async readRepairPhoto(path) {
      const { data, error } = await write().storage.from(REPAIR_BUCKET).createSignedUrl(path, 60)
      return error || !data ? null : { url: data.signedUrl }
    },
  }
  return store
}
