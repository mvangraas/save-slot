# Save Slot

_Your Game Boy collection, saved._

A collector archive for **Game Boy** and **Game Boy Color**:
discover → collect → complete → play → wishlist → remember.

The full product and build spec is in [`SAVE-SLOT-MASTER-PROMPT.md`](./SAVE-SLOT-MASTER-PROMPT.md).
Phase reports live in [`reports/`](./reports).

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage) · Vitest · Playwright · Vercel

## Getting started

```bash
pnpm install
cp .env.example .env.local   # Supabase values are optional for now
pnpm dev                     # http://localhost:3000
```

The app runs without Supabase configured; auth simply shows "Sign in".
The design system preview is at `/dev/components` (development only).

### Local Supabase (optional)

```bash
pnpm dlx supabase start      # needs Docker
```

## Scripts

| Command                                        | What it does                                                    |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `pnpm dev`                                     | Dev server                                                      |
| `pnpm build` / `pnpm start`                    | Production build / serve                                        |
| `pnpm lint` · `pnpm typecheck` · `pnpm format` | Code quality                                                    |
| `pnpm test`                                    | Unit and component tests (Vitest, incl. colour-contrast checks) |
| `pnpm test:e2e`                                | End-to-end tests (Playwright, desktop + mobile, incl. axe)      |
| `pnpm check`                                   | Lint, typecheck, tests and build in one go                      |

If Playwright can't download browsers, point it at an installed Chromium with
`PLAYWRIGHT_CHROMIUM_PATH=/path/to/chrome`.

## Legal

Save Slot is a fan-made collector archive and is not affiliated with, endorsed or sponsored by
Nintendo. Game Boy and Game Boy Color are trademarks of Nintendo. Save Slot does not host, link to
or stream ROMs.
