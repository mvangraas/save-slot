# Shop & repair service — setup

The webshop and the repair service are built but **stay closed** (checkout and repair intake show
"opens soon") until the owner has filled in real business details. Nothing below is invented by
the code: no company name, KvK number, VAT status or legal text is shipped.

## 1. Admin access

Vercel → project `save-slot` → Settings → Environment Variables:

| Variable       | Example                     | Notes                                   |
| -------------- | --------------------------- | --------------------------------------- |
| `ADMIN_EMAILS` | `merijnvangraas@icloud.com` | Comma-separated. Gives access to /admin |

Sign in on the site with that e-mail address and open `/admin`.

## 2. Business details (after registering with the KvK)

| Variable                        | Required | Example / allowed values                         |
| ------------------------------- | -------- | ------------------------------------------------ |
| `SHOP_LEGAL_NAME`               | yes      | Registered trade name                            |
| `SHOP_KVK`                      | yes      | KvK number                                       |
| `SHOP_ADDRESS`                  | yes      | Address shown on contact/legal pages             |
| `SHOP_EMAIL`                    | yes      | Customer service e-mail                          |
| `SHOP_VAT_MODE`                 | yes      | `vat21`, `margin` or `kor` — ask your accountant |
| `SHOP_VAT_ID`                   | if vat21 | BTW-id                                           |
| `SHOP_PHONE`                    | no       |                                                  |
| `SHOP_SHIPPING_CENTS`           | yes      | e.g. `495` for €4.95                             |
| `SHOP_FREE_SHIPPING_FROM_CENTS` | no       | e.g. `5000` for free shipping from €50           |

## 3. Legal texts

Fill in `src/content/legal/index.ts` (`terms`, `privacy`, `shipping-returns`, `warranty`).
Checkout needs terms, privacy and shipping/returns; repair intake needs privacy. Have them
checked — do not copy another shop's texts.

## 4. Mollie

1. Create a Mollie account and finish onboarding.
2. Set `MOLLIE_API_KEY` (`test_…` first, `live_…` when going live).
3. Webhook: the app passes `https://<your-domain>/api/mollie/webhook` with every payment; nothing
   to configure in the Mollie dashboard. The payment status is always read back from Mollie.

## 5. Supabase

The migration `supabase/migrations/20261013090000_shop_and_repairs.sql` is already applied to the
Save Slot project. Buckets: `product-images` (public) and `repair-photos` (private).
`SUPABASE_SECRET_KEY` must be set (it already is).

## 6. Check

`/admin` shows a setup checklist. When every item is green, checkout and repair intake open.
Do a test order with a `test_` key before switching to `live_`.

## Not included yet

- E-mail notifications (order confirmation, repair status). Customers keep their order/repair
  link and can look up repairs with number + e-mail.
- Invoices/PDFs.
