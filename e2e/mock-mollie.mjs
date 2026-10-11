// A tiny stand-in for the Mollie Payments API, used ONLY by the e2e tests (never in
// production). It mimics the parts Save Slot uses: create/get payment, a hosted checkout page
// where the test clicks "Pay" or "Cancel", and the webhook call Mollie makes afterwards.
import { createServer } from 'node:http'

const PORT = Number(process.env.MOCK_MOLLIE_PORT ?? 3199)
const payments = new Map()
let seq = 0

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}
const readBody = (req) =>
  new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
  })

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (url.pathname === '/health') return json(res, 200, { ok: true })

  if (url.pathname.startsWith('/v2/')) {
    if (req.headers.authorization !== 'Bearer test_e2e_mock_mollie_key_000000') {
      return json(res, 401, { status: 401, title: 'Unauthorized' })
    }
  }
  if (req.method === 'POST' && url.pathname === '/v2/payments') {
    const body = JSON.parse(await readBody(req))
    const id = `tr_mock${++seq}${Date.now().toString(36)}`
    const p = {
      id,
      status: 'open',
      amount: body.amount,
      description: body.description,
      redirectUrl: body.redirectUrl,
      webhookUrl: body.webhookUrl ?? null,
      metadata: body.metadata ?? null,
      _links: { checkout: { href: `http://localhost:${PORT}/checkout/${id}` } },
    }
    payments.set(id, p)
    return json(res, 201, p)
  }
  const get = url.pathname.match(/^\/v2\/payments\/(tr_\w+)$/)
  if (req.method === 'GET' && get) {
    const p = payments.get(get[1])
    return p ? json(res, 200, p) : json(res, 404, { status: 404 })
  }
  const page = url.pathname.match(/^\/checkout\/(tr_\w+)$/)
  if (req.method === 'GET' && page && payments.has(page[1])) {
    const p = payments.get(page[1])
    res.writeHead(200, { 'Content-Type': 'text/html' })
    return res.end(`<!doctype html><title>Mock payment</title><h1>Mock payment ${p.amount.value} ${p.amount.currency}</h1>
      <form method="post" action="/checkout/${p.id}/pay"><button>Pay</button></form>
      <form method="post" action="/checkout/${p.id}/cancel"><button>Cancel payment</button></form>`)
  }
  const act = url.pathname.match(/^\/checkout\/(tr_\w+)\/(pay|cancel)$/)
  if (req.method === 'POST' && act && payments.has(act[1])) {
    const p = payments.get(act[1])
    p.status = act[2] === 'pay' ? 'paid' : 'canceled'
    if (p.webhookUrl) {
      await fetch(p.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `id=${p.id}`,
      }).catch(() => {})
    }
    res.writeHead(303, { Location: p.redirectUrl })
    return res.end()
  }
  json(res, 404, { status: 404 })
}).listen(PORT, () => console.log(`mock mollie on ${PORT}`))
