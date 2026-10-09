# Fase 1 — Fundament · rapport

**Status:** klaar, in afwachting van akkoord voor fase 2.

## Wat er gebouwd is

**Project-setup**

- Next.js 16.4 (App Router, Cache Components en Partial Prefetching staan aan), React 19.3, TypeScript strict, Tailwind CSS v4, pnpm
- ESLint (Next-config), Prettier met de Tailwind-plugin
- Vitest + Testing Library + axe-core (unit- en componenttests), Playwright + @axe-core/playwright (e2e, desktop en mobiel)
- `pnpm check` draait lint, typecheck, tests en build in één keer
- `.env.example` met alle variabelen uit §13. Er zit geen enkele echte waarde in de repo.

**Design system** (`src/app/globals.css`)

- Alle tokens uit §3: LCD-groen, de behuizing, de platformaccenten, papier, stickers en cartridge-plastic
- Semantische tokens per thema (`bg`, `surface`, `fg`, `fg-muted`, `gb-text`, `gbc-text`, `focus`)
- **Dark mode is standaard.** Light mode gebruikt de grijze DMG-behuizing met papier. De volgorde is: opgeslagen keuze → OS-voorkeur → dark. Een boot-script zet het thema vóór de eerste paint, dus er is geen flits.
- Hulpklassen `scanlines`, `cart-shape` en `pixel-border`, plus de animaties `blink`, `led-on` en `pixel-in`
- **Reduce effects:** werkt via de OS-instelling (`prefers-reduced-motion`) én via een eigen schakelaar in de footer. Die zet scanlines en animaties uit.
- Fonts via `next/font/google`: Press Start 2P, Silkscreen, IBM Plex Sans en IBM Plex Mono (allemaal OFL)

**App-shell**

- Header in behuizing-stijl met een power-LED, de hoofdnavigatie, GB/GBC-snelkoppelingen, een thema-toggle en een gebruikersslot
- Op mobiel een bottom nav met 5 "knoppen". Op desktop zie je de header-nav.
- Footer met de Nintendo-disclaimer op elke pagina
- Skip-link en zichtbare focus (3px outline)
- Logo en favicon zijn een eigen pixel-ontwerp (cartridge met hartje), niet gebaseerd op Nintendo-artwork

**Componenten** (`src/components/retro`)
`LcdPanel` (gb/gbc), `CartridgeCard` (grijs / zwart dual-mode / transparant GBC-only, 3 maten, owned/wishlist, skeleton), `PixelButton` (primary/secondary/ghost/screen, als button of link), `PlatformBadge`, `RegionTag`, `Sticker` (8 soorten), `EmptyState`, `LoadingState` (power-LED + knipperende cursor), `ErrorState` (GAME OVER / CONTINUE?).
Je kunt ze allemaal bekijken op **`/dev/components`**. Die pagina werkt alleen in development, of met `ENABLE_DEV_PAGES=1`.

**Pagina's**

- `/`: de uitgelogde homepage met de hero "YOUR GAME BOY COLLECTION", tegels voor GB en GBC, een voorbeeldplank met 5 cartridges en "HOW TO PLAY" met de zes stappen
- 404 (`GAME OVER`), een error-boundary en een loading-state
- `/about` met de disclaimer, de no-ROM-verklaring en de fontlicenties
- Placeholders voor `/games`, `/gb`, `/gbc`, `/collection`, `/wishlist`, `/stats` en `/login`. Die tonen in welke fase ze komen, zodat de navigatie nergens doodloopt.

**Supabase**

- `supabase/config.toml` via `supabase init` (project_id `save-slot`), met een lege `migrations/`
- Clients via `@supabase/ssr`: `lib/supabase/server.ts`, `client.ts` en `proxy.ts`. De sessie wordt ververst in `src/proxy.ts` (Next 16-conventie).
- **Zonder Supabase-config draait de app gewoon door.** Alle clients geven dan `null` terug en de header toont "Sign in".

## Tests

| Soort                              | Aantal | Resultaat |
| ---------------------------------- | ------ | --------- |
| Unit + component (Vitest)          | 48     | ✅ groen  |
| E2E (Playwright, desktop + mobiel) | 20     | ✅ groen  |
| Lint, typecheck, Prettier, build   | —      | ✅ groen  |

De e2e-tests dekken de homepage, 404, de thema-toggle met persistentie, reduce effects, de actieve navigatie, de componentpagina in beide thema's en axe (WCAG 2.2 AA) op `/`, `/dev/components`, `/about` en `/games`.

### Contrast (WCAG AA ≥ 4.5:1)

De test leest de kleuren rechtstreeks uit `globals.css` en faalt als een combinatie onder 4.5:1 zakt.

| Combinatie                                         | Ratio                |
| -------------------------------------------------- | -------------------- |
| LCD-tekst (`lcd-900` op `lcd-200`)                 | 6.0:1                |
| LCD-tekst op labelverloop (`lcd-900` op `lcd-400`) | 5.0:1                |
| GBC-paneel (`gbc-deep` op `gbc-50`)                | 10.3:1               |
| GBC-labelverloop (`gbc-deep` op `gbc-soft`)        | 5.4:1                |
| Dark: tekst op achtergrond / surface / surface-2   | 15.6 / 14.0 / 11.9:1 |
| Dark: muted op achtergrond / surface / surface-2   | 7.9 / 7.1 / 6.0:1    |
| Dark: GB-accent / GBC-accent op surface            | 7.6 / 7.1:1          |
| Light: inkt op papier / behuizing                  | 15.0 / 12.5:1        |
| Light: muted op papier / behuizing                 | 8.3 / 6.9:1          |
| Light: GB-accent / GBC-accent op papier            | 6.3 / 7.4:1          |
| Stickers: geel / rood / rumble                     | 11.9 / 6.0 / 9.8:1   |
| Tekst op grijze / zwarte cartridge                 | 8.6 / 12.1:1         |

## Afwijkingen van het plan en waarom

1. **Extra token `sticker-red` (#c0211c).** Witte tekst op de power-LED-rood (#e5322d) haalde maar ~4:1. Voor stickers gebruik ik daarom een donkerdere rode tint. Het LED-rood blijft voor de LED zelf.
2. **Extra knopvariant `screen`.** Dit is een donkergroene knop voor gebruik op een groen LCD-paneel. Zonder deze variant was de primaire knop op de hero onzichtbaar.
3. **Bezel-tekst is "Collector archive".** Ik gebruik niet de tekst van de originele Game Boy-rand, omdat dat Nintendo-trade dress is.
4. **De voorbeeldplank op de homepage gebruikt 5 bekende titels.** Ze zijn gemarkeerd met `source: 'seed'` en hebben alleen titel, carttype en jaar van eerste release, zonder prijzen, codes of afbeeldingen. In fase 2 komt de echte catalogus ervoor in de plaats.
5. **Supabase-sleutel heet `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.** Dat sluit aan op de nieuwe Supabase-keys (publishable/secret) in plaats van de oude `anon`-key.
6. **Cache Components staat aan** (Next 16-standaard). Daardoor staan de sessie-uitlezing in de header en de actieve navigatie achter `<Suspense>`. De rest van elke pagina wordt statisch gerenderd.

## Wat nog openstaat

- **Er is nog geen Supabase-project gekoppeld.** Lokaal draaien vraagt Docker (`supabase start`). Het echte project in MerijnBiz maken we in fase 2 of 7, na je akkoord.
- **De Vercel-koppeling is nog niet gedaan.** Dat staat in fase 7.
- **CI (GitHub Actions) staat in fase 7.**
- **Playwright** gebruikt in deze omgeving een al geïnstalleerde Chromium (`PLAYWRIGHT_CHROMIUM_PATH`). Lokaal of in CI kun je gewoon `pnpm exec playwright install chromium` doen.

## BrickFigLy-check

Er komt geen enkele verwijzing naar BrickFigLy voor in code, config of env (gecontroleerd met `grep -ri brickfig`, behalve de afschermregels in `CLAUDE.md` en de master prompt).

## Screenshots

`reports/phase-1/`: home (dark, light, mobiel), de componentpagina en de 404.
