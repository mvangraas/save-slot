/** Webshop & repair service domain model (mirrors supabase/migrations/*_shop_and_repairs.sql). */

export const PRODUCT_CONDITIONS = ['new', 'used', 'refurbished'] as const
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]
export const productConditionLabel: Record<ProductCondition, string> = {
  new: 'New',
  used: 'Used',
  refurbished: 'Refurbished',
}

export type Category = { id: string; slug: string; name: string; sort: number }

export type ProductImage = { id: string; path: string; url: string; alt: string | null }

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  categoryId: string | null
  categoryName: string | null
  priceCents: number
  stock: number
  condition: ProductCondition
  specs: { label: string; value: string }[]
  active: boolean
  images: ProductImage[]
  createdAt: string
}

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name'] as const
export type ProductSort = (typeof PRODUCT_SORTS)[number]

export type ProductQuery = {
  q?: string
  category?: string
  condition?: ProductCondition
  inStock?: boolean
  sort: ProductSort
  page: number
  pageSize: number
}

export type ProductInput = {
  slug: string
  name: string
  description: string
  categoryId: string | null
  priceCents: number
  stock: number
  condition: ProductCondition
  specs: { label: string; value: string }[]
  active: boolean
}

export const ORDER_STATUSES = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'completed',
  'cancelled',
  'payment_failed',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]
export const orderStatusLabel: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  processing: 'Being prepared',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  payment_failed: 'Payment failed',
}

export type Address = {
  street: string
  houseNumber: string
  postalCode: string
  city: string
  country: 'NL' | 'BE'
}

export type OrderItem = {
  productId: string | null
  name: string
  unitPriceCents: number
  quantity: number
}

export type Order = {
  id: string
  number: string
  userId: string | null
  email: string
  name: string
  phone: string | null
  address: Address
  status: OrderStatus
  items: OrderItem[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  molliePaymentId: string | null
  needsAttention: string | null
  createdAt: string
  paidAt: string | null
}

export type NewOrder = Omit<
  Order,
  'id' | 'number' | 'status' | 'molliePaymentId' | 'needsAttention' | 'createdAt' | 'paidAt'
>

// ---- Repairs

export const REPAIR_STATUSES = [
  'received',
  'in_progress',
  'waiting_parts',
  'repairing',
  'done',
  'ready_or_shipped',
] as const
export type RepairStatus = (typeof REPAIR_STATUSES)[number]
export const repairStatusLabel: Record<RepairStatus, string> = {
  received: 'Request received',
  in_progress: 'Being assessed',
  waiting_parts: 'Waiting for parts',
  repairing: 'Repair in progress',
  done: 'Repair finished',
  ready_or_shipped: 'Ready for pickup or shipped',
}

export const DELIVERY_METHODS = ['appointment', 'mail_in', 'drop_off'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]
export const deliveryLabel: Record<DeliveryMethod, string> = {
  appointment: 'Make an appointment',
  mail_in: 'Send it by post',
  drop_off: 'Drop it off in person',
}

export type RepairDevice = { id: string; slug: string; name: string; sort: number }
export type RepairIssue = {
  id: string
  slug: string
  name: string
  description: string
  sort: number
}
/** Owner-set indication. Null values mean "price/duration on request". */
export type RepairPrice = {
  deviceId: string
  issueId: string
  priceFromCents: number | null
  priceToCents: number | null
  daysMin: number | null
  daysMax: number | null
}

export type RepairCatalog = {
  devices: RepairDevice[]
  issues: RepairIssue[]
  prices: RepairPrice[]
}

export type RepairEvent = {
  status: RepairStatus
  note: string | null
  createdAt: string
}

export type RepairRequest = {
  id: string
  number: string
  userId: string | null
  name: string
  email: string
  phone: string
  deviceId: string
  deviceName: string
  issueId: string
  issueName: string
  brand: string | null
  model: string | null
  serial: string | null
  description: string
  delivery: DeliveryMethod
  preferredDate: string | null
  status: RepairStatus
  estimate: Pick<RepairPrice, 'priceFromCents' | 'priceToCents' | 'daysMin' | 'daysMax'> | null
  finalPriceCents: number | null
  photoPaths: string[]
  events: RepairEvent[]
  createdAt: string
  updatedAt: string
}

export type RepairNote = { id: string; body: string; author: string; createdAt: string }

export type NewRepair = Pick<
  RepairRequest,
  | 'userId'
  | 'name'
  | 'email'
  | 'phone'
  | 'deviceId'
  | 'issueId'
  | 'brand'
  | 'model'
  | 'serial'
  | 'description'
  | 'delivery'
  | 'preferredDate'
>

export type Photo = { bytes: Uint8Array; contentType: string }

export type ShopResult<T = void> = { ok: true; data: T } | { ok: false; error: string }

/** Storage for the shop and repair service. All writes are made by trusted server code. */
export interface ShopStore {
  // catalogue
  listCategories(): Promise<Category[]>
  listProducts(
    q: ProductQuery,
    opts?: { includeInactive?: boolean },
  ): Promise<{
    items: Product[]
    total: number
  }>
  getProduct(slug: string, opts?: { includeInactive?: boolean }): Promise<Product | null>
  getProductsByIds(ids: string[]): Promise<Product[]>
  /** Admin: any product, including hidden ones. */
  getProductById(id: string): Promise<Product | null>
  // admin: products
  saveProduct(id: string | null, input: ProductInput): Promise<ShopResult<{ id: string }>>
  deleteProduct(id: string): Promise<ShopResult>
  saveCategory(input: { slug: string; name: string }): Promise<ShopResult>
  addProductImage(productId: string, photo: Photo, alt: string | null): Promise<ShopResult>
  removeProductImage(imageId: string): Promise<ShopResult>
  readProductImage(path: string): Promise<Photo | null>
  // orders
  createOrder(
    order: NewOrder,
    tokenHash: string,
  ): Promise<ShopResult<{ id: string; number: string }>>
  attachPayment(orderId: string, molliePaymentId: string): Promise<void>
  getOrderByNumber(number: string): Promise<(Order & { tokenHash: string }) | null>
  getOrderByPayment(molliePaymentId: string): Promise<Order | null>
  /** Atomically marks paid and takes stock; returns a note when stock was short. */
  markOrderPaid(orderId: string): Promise<{ alreadyPaid: boolean; shortage: string | null }>
  setOrderStatus(orderId: string, status: OrderStatus): Promise<ShopResult>
  listOrders(opts: { status?: OrderStatus; limit: number }): Promise<Order[]>
  getOrder(id: string): Promise<Order | null>
  // repairs
  repairCatalog(): Promise<RepairCatalog>
  setRepairPrice(price: RepairPrice): Promise<ShopResult>
  createRepair(
    input: NewRepair,
    photos: Photo[],
    tokenHash: string,
  ): Promise<ShopResult<{ id: string; number: string }>>
  getRepairByNumber(number: string): Promise<(RepairRequest & { tokenHash: string }) | null>
  listRepairs(opts: {
    status?: RepairStatus
    open?: boolean
    limit: number
  }): Promise<RepairRequest[]>
  getRepair(id: string): Promise<RepairRequest | null>
  updateRepairStatus(id: string, status: RepairStatus, note: string | null): Promise<ShopResult>
  setRepairFinalPrice(id: string, cents: number | null): Promise<ShopResult>
  addRepairNote(id: string, body: string, author: string): Promise<ShopResult>
  listRepairNotes(id: string): Promise<RepairNote[]>
  readRepairPhoto(path: string): Promise<Photo | { url: string } | null>
}
