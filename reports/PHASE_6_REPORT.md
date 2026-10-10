# Fase 6 — Externe data en nieuws

## Wat is er gebouwd

**Nieuws (`/news`)**

- Er zijn vier bronnen, in `src/config/news-sources.ts`:
  - Time Extension
  - RetroRGB
  - Retro Gamer
  - GB Studio Central
- Je antwoord was: "alleen als de website iets te melden heeft". Dat is zo uitgewerkt:
  - Van Time Extension, RetroRGB en Retro Gamer worden alleen berichten bewaard die over Game Boy / Game Boy Color gaan.
  - GB Studio Central gaat helemaal over de Game Boy, dus daar telt alles.
  - Is er niets te melden, dan verschijnt er op de homepage géén nieuwsblok. `/news` toont dan "NO SIGNAL".
- We slaan per bericht alleen titel, link, bron, datum en een samenvatting van maximaal 200 tekens op. Klikken opent het originele artikel in een nieuw tabblad.
- **RSS-verwerking** (`src/lib/news/parse.ts`):
  - RSS 2.0 en Atom.
  - HTML wordt eruit gehaald.
  - Alleen http(s)-links (geen `javascript:`), geen DOCTYPE-entity-expansie.
  - Feeds groter dan 2 MB worden geweigerd, met een timeout van 10 s per bron.
- **Cron-route `/api/cron/news`:**
  - Beveiligd met `CRON_SECRET` (Bearer, timing-safe vergelijking).
  - Elke bron draait apart: een kapotte feed stopt de rest niet.
  - Het antwoord is een rapport per bron.
  - Na afloop wordt de nieuwscache ververst.
- **Vercel Cron:** dagelijks om 05:17 UTC (`vercel.json`). Dagelijks, omdat het Hobby-plan niet vaker toestaat. Op Pro kan het naar elke 6 uur (`17 */6 * * *`).
- Homepage: blok "Latest news" met 3 berichten, alleen als er nieuws is. In de footer staat een link "News".

**Externe data-providers (achter feature flags)**

- Interfaces in `src/lib/providers/types.ts`: `CatalogImportProvider`, `PriceProvider`, `NewsProvider`.
- Een provider draait alleen als de flag aan staat **én** de sleutels aanwezig zijn (`src/config/flags.ts`):
  - `FEATURE_IGDB=1` + `IGDB_CLIENT_ID` / `IGDB_CLIENT_SECRET`
  - `FEATURE_PRICECHARTING=1` + `PRICECHARTING_API_KEY`
- **IGDB** (`src/lib/providers/igdb.ts`):
  - games voor platform 33 (GB) en 22 (GBC)
  - releases per regio (EU/US/JP) met datumprecisie
  - developer/publisher, genres
  - cover met bronvermelding "Cover via IGDB.com"
  - IGDB zegt niet of een GBC-game ook op de oude Game Boy werkt. Zulke games worden gemarkeerd als "needs review".
- **PriceCharting** (`src/lib/providers/pricecharting.ts`):
  - loose/CIB/new per regio (GameBoy, PAL, JP)
  - alleen bij een exacte console-match
  - prijzen worden in USD opgeslagen
- **Import-scripts** (standaard dry-run, `--apply` om te schrijven):
  - `node --env-file=.env.local scripts/import-catalog.mts [--apply] [--limit N]`
    - Idempotent: koppelt eerst op IGDB-id, dan op slug.
    - Bestaande (gecontroleerde) data wordt nooit overschreven; alleen wat ontbreekt wordt aangevuld.
    - Unieke slugs; de dry-run toont een lijst met te controleren items.
  - `node --env-file=.env.local scripts/import-prices.mts [--apply] [--limit N]`
    - Idempotent per dag.
    - Respecteert de rate limit (1 per seconde).
- **Prijsindex** (`src/lib/catalog/price-index.ts`):
  - Echte bronnen gaan per release vóór demo-data.
  - USD wordt alleen getoond als `PRICE_FX_USD_EUR` is gezet; de UI meldt de omrekening. Dat volgt §9: alleen omrekenen voor weergave.
- **`/about`** toont nu live bronvermeldingen: hoeveel games, covers en prijzen per bron, plus de nieuwsbronnen en lettertypen. IGDB en PriceCharting verschijnen pas als er echt data van die bron is.

## Tests

- `pnpm check`: lint, typecheck, **155 unit-tests** en de build zijn groen. Nieuw:
  - RSS/Atom-parser (inclusief een kwaadaardige DOCTYPE, onveilige links, HTML-stripping, de limiet van 200 tekens)
  - refresh-job (bronnen apart afgehandeld, idempotent, uitgeschakelde bronnen, te grote feeds)
  - IGDB-mapping en API-aanroep
  - PriceCharting-mapping
  - de import-planner (koppelen, idempotent, unieke slugs)
  - de prijsindex (bronvoorkeur, FX)
  - de feature flags
- `pnpm test:e2e`: **80 e2e-tests** groen. Nieuw:
  - cron zonder of met een fout secret geeft 401
  - cron met fixture-feeds slaat alleen Game Boy-nieuws op, en gaat door als een bron faalt
  - `/news` toont de berichten (+ axe)
  - het nieuwsblok staat op de homepage
- Een bestaande, wisselvallige navigatietest (race met een redirect naar /login) is stabiel gemaakt.

## Supabase (project Save-slot `stvjldcxadrbcnodvhop`)

- Geen schemawijziging nodig. De tabellen `news_sources`/`news_items` en de RLS (iedereen mag lezen, alleen de service role mag schrijven) bestonden al.
- De nieuwsquery is live gecontroleerd via de REST-API: 200 OK, nog leeg.

## Wat jij nog moet doen

1. **Vercel → Environment Variables:**
   - `CRON_SECRET`: een willekeurige lange tekst van minimaal 16 tekens. Type: Secret.
   - `SUPABASE_SECRET_KEY`: de secret key uit Supabase → Project Settings → API Keys. Type: Secret, **nooit** `NEXT_PUBLIC_`.
2. Opnieuw deployen. Daarna kun je het nieuws meteen ophalen via Vercel → Settings → Cron Jobs → "Run". Anders gebeurt het de volgende ochtend vanzelf.
3. Kijk in de logs van de cron-run (`[cron/news]`) welke feeds werken. Ik kon de vier feed-adressen vanuit mijn omgeving niet openen. Faalt er een, dan geeft het rapport `HTTP 404` en passen we het adres aan.
4. Optioneel en later:
   - IGDB-sleutels (gratis via dev.twitch.tv) en/of PriceCharting (betaald)
   - daarna eerst het import-script als dry-run draaien

## Afwijkingen en keuzes

- De cron draait dagelijks in plaats van elke 6 uur (zie hierboven).
- De import-scripts zijn gebouwd en getest met nagebootste API-antwoorden, maar zijn nog niet tegen de echte IGDB/PriceCharting gedraaid, want er zijn nog geen sleutels.
- MobyGames, TheGamesDB, ScreenScraper en No-Intro uit §8 zijn niet gebouwd. Dankzij de provider-interfaces kunnen ze later worden toegevoegd.

## BrickFigLy-check

- Er is niets van BrickFigLy gebruikt of aangeraakt. Alleen `stvjldcxadrbcnodvhop` is gelezen; er is niets naar geschreven.

## Screenshots

`reports/phase-6/`:

- `news-dark.png`
- `news-light.png`
- `news-m.png`
- `home-news.png`
- `about.png`

Het nieuws komt hier uit testfixtures, niet uit de echte feeds.

## Volgende fase

Fase 7: security headers/CSP, rate limiting, data-export en account verwijderen, Lighthouse/axe, GitHub Actions CI en de pre-launch checklist.
