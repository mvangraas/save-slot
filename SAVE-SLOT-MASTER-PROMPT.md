# SAVE SLOT — COMPLETE CLAUDE CODE MASTER PROMPT

> Kopieer dit hele bestand 1-op-1 naar Claude Code, in de root van de repo `mvangraas/save-slot`.

---

## 0. Rol en werkwijze

Je bent een senior full-stack engineer en product designer. Je bouwt **Save Slot**: een digitale verzamelplek voor **Game Boy** en **Game Boy Color**.

Hoe je werkt:

1. **Fase voor fase.** Bouw één fase uit §14 en stop dan. Schrijf daarna `reports/PHASE_<n>_REPORT.md` met wat er gebouwd is, wat afwijkt van dit plan en waarom, welke tests er zijn (en of ze slagen), en wat er nog openstaat. Wacht op mijn akkoord voordat je aan de volgende fase begint.
2. **Eerst lezen, dan bouwen.** Lees deze prompt helemaal door voordat je code schrijft. Is iets onduidelijk of tegenstrijdig? Kies dan de meest redelijke optie, schrijf die op in het rapport en ga door.
3. **Geen nepdata als echte data.** Seed- en mockdata zijn duidelijk gemarkeerd (`source: 'seed'`). Verzin geen echte prijzen, releasedatums of productcodes die je niet zeker weet.
4. **Kleine, logische commits** met duidelijke berichten (Conventional Commits: `feat:`, `fix:`, `chore:` …).
5. **Taal:** code, identifiers, commits en UI-teksten in het **Engels**. Rapporten aan mij in het **Nederlands**.

### Harde grens: los van BrickFigLy

Save Slot heeft **niets** te maken met BrickFigLy. Gebruik nooit het Vercel-project, het Supabase-project, de env vars, de database of de code van BrickFigLy. Kopieer ook geen bestanden daaruit. Zie je ergens een verwijzing naar `brickfigly`? Stop dan en meld het.

---

## 1. Product in één zin

> **Save Slot is het archief van je Game Boy-jeugd: ontdek elke game, houd bij wat je hebt, maak je collectie compleet en bewaar de herinneringen erbij.**

### De kernloop

```
DISCOVER → COLLECT → COMPLETE → PLAY → WISHLIST → REMEMBER
```

| Stap     | Wat de gebruiker doet                                                | Waar                                   |
| -------- | -------------------------------------------------------------------- | -------------------------------------- |
| DISCOVER | Browsen, zoeken en filteren door de complete GB/GBC-bibliotheek      | `/games`, `/gb`, `/gbc`, game-detail   |
| COLLECT  | Aangeven welke release je hebt (cart, doos, handleiding, staat)      | game-detail, `/collection`             |
| COMPLETE | Voortgang per platform en regio zien en gaten vinden                 | `/collection`, `/stats`                |
| PLAY     | Bijhouden wat je speelt, hebt uitgespeeld of in je backlog staat     | game-detail, `/collection?tab=playing` |
| WISHLIST | Games op je verlanglijst zetten met prioriteit en maximale prijs     | `/wishlist`                            |
| REMEMBER | Persoonlijke herinneringen per game ("Kerst 1998, van opa gekregen") | game-detail, profiel                   |

> **PLAY betekent níét emuleren.** Save Slot host, linkt of streamt **nooit** ROMs en bevat geen emulator. "Play" is een speellog.

---

## 2. Merk en identiteit

- **Naam:** Save Slot
- **Tagline:** _Your Game Boy collection, saved._
- **Homepage-hero:**
  ```
  YOUR GAME BOY COLLECTION
  Rediscover the games that started it all.
  ```
- **Toon:** warm, nostalgisch en een beetje speels, maar nooit kinderachtig. Denk aan een liefhebber achter de toonbank van een retro gamewinkel, niet aan een startup.
- **Microcopy-voorbeelden:**
  - Empty state collectie: `NO DATA ON THIS SAVE FILE. Add your first cartridge →`
  - Opslaan gelukt: `PROGRESS SAVED`
  - 404: `GAME OVER — this page doesn't exist. CONTINUE?  ▶ YES  NO`
  - Laden: `LOADING…` met een knipperend blokcursortje

### Juridisch en merkgebruik (verplicht)

- "Game Boy", "Game Boy Color" en "Nintendo" zijn merken van Nintendo. Gebruik ze **alleen beschrijvend** (om aan te geven over welk platform het gaat).
- **Niet gebruiken:** het Nintendo-logo, het Game Boy-logo of -lettertype, de Nintendo-seal, officiële artwork van de console en Nintendo-mascottes als decoratie.
- **Zelf ontwerpen:** alle pixel-art, iconen en cartridge-illustraties zijn eigen, generieke ontwerpen.
- Footer op elke pagina: _"Save Slot is a fan-made collector archive and is not affiliated with, endorsed or sponsored by Nintendo. Game Boy and Game Boy Color are trademarks of Nintendo."_
- Box art, cartridgefoto's en screenshots komen **alleen** van bronnen waarvan de licentie of API-voorwaarden weergave toestaan (zie §8). Per afbeelding sla je de bron en naamsvermelding op en die toon je ook.

---

## 3. Visuele richting

### Wat het níét is

> Een moderne SaaS-site met wat pixel-icoontjes erop geplakt.

### Wat het wél is

> **1990s Nintendo handheld nostalgia × retro game store × collector archive.**

De site voelt als een fysiek object: een donkergrijze handheld-behuizing, een groen LCD-scherm, een kast vol cartridges en een vergeeld spelboekje. De UX blijft wel modern: snel, duidelijk, toegankelijk en mobile-first.

### Ingrediënten

- **LCD-groen** als het "scherm" waarin content verschijnt (hero, stats, lege staten)
- **Donkergrijze of zwartachtige behuizing** als achtergrond van de app-shell, met heel subtiele textuur
- **Cartridge-vormige cards:** een rechthoek met één afgeschuinde hoek rechtsboven, een labelvlak en een groefje bovenaan
- **Pixel-typografie** alleen voor koppen, labels, badges en cijfers. Bodytekst blijft goed leesbaar.
- **CRT/scanlines:** héél subtiel en alleen op LCD-vlakken. Uit bij `prefers-reduced-motion` of als de gebruiker "Reduce effects" aanzet.
- **Game-manual-gevoel** op detailpagina's: genummerde secties, kaders, "HOW TO PLAY"-achtige koppen en papiertint
- **Stickers en badges:** prijsstickers, "CIB", "BOXED", "JP IMPORT", "SGB ENHANCED", "RUMBLE PAK"
- **Retro loading states:** een power-LED die aangaat, een "Nintendo-achtige" boot-scroll (zonder logo!) en blokjes die vollopen
- **8-bit micro-interactions:** knoppen die 2px "indrukken", een korte pixel-sparkle bij het toevoegen aan je collectie en optionele 8-bit geluidjes (standaard **uit**)

### Twee platformen, één identiteit

|                | Game Boy (DMG)   | Game Boy Color (CGB)                                  |
| -------------- | ---------------- | ----------------------------------------------------- |
| Accent         | LCD-groen        | Berry/paars                                           |
| Cartridge-tint | Grijs            | Zwart (dual-mode) / transparant (GBC-only)            |
| Badge          | `GB`             | `GBC`                                                 |
| Sectie-header  | Groen LCD-paneel | Paars paneel met subtiele kleurverloop-"color"-pixels |

Elke game-card, filter-chip en grafiek gebruikt het juiste platformaccent. De rest van de site (shell, typografie, componenten) is gedeeld.

### Design tokens (Tailwind v4 `@theme`)

```css
@theme {
  /* LCD (DMG-palet) */
  --color-lcd-900: #0f380f;
  --color-lcd-700: #306230;
  --color-lcd-400: #8bac0f;
  --color-lcd-200: #9bbc0f;
  --color-lcd-50: #e0f0c0;

  /* Behuizing */
  --color-shell-950: #141416;
  --color-shell-900: #1e1e22;
  --color-shell-800: #2b2b30;
  --color-shell-600: #4a4a52;
  --color-shell-300: #a9a9b2;
  --color-shell-100: #dcdcd6; /* grijze DMG-behuizing */

  /* Platformaccenten */
  --color-gb: #8bac0f;
  --color-gbc: #8e44ad;
  --color-gbc-soft: #c39bd3;

  /* Manual-papier */
  --color-paper: #f4efe1;
  --color-ink: #1b1b1b;

  /* Signaal */
  --color-power: #e5322d; /* power-LED */
  --color-sticker: #ffd23f;

  --font-pixel: 'Press Start 2P', ui-monospace, monospace;
  --font-display: 'Silkscreen', ui-monospace, monospace;
  --font-body: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}
```

- Fonts gaan via `next/font/google`. Ze hebben allemaal een OFL-licentie.
- **Let op het contrast:** DMG-groen op groen haalt vaak geen WCAG AA. Tekst op LCD-vlakken moet minimaal 4.5:1 halen (gebruik `lcd-900` op `lcd-200`). Controleer elke combinatie en noteer de ratio's in het rapport.
- Lever **dark mode als standaard** (behuizing donker) en een **light mode** (grijze DMG-behuizing + papier). Respecteer `prefers-color-scheme` en bied een toggle.

---

## 4. Tech stack

| Onderdeel       | Keuze                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| Framework       | **Next.js 16** (App Router, React Server Components, Server Actions)                                   |
| Taal            | **TypeScript** strict                                                                                  |
| Styling         | **Tailwind CSS v4** (CSS-first `@theme`)                                                               |
| Database        | **Supabase Postgres**                                                                                  |
| Auth            | **Supabase Auth** (e-mail magic link + e-mail/wachtwoord), via `@supabase/ssr`                         |
| Storage         | **Supabase Storage** voor zelf geüploade foto's van je eigen collectie                                 |
| Migraties       | **Supabase CLI** (`supabase/migrations/*.sql`) en gegenereerde TS-types                                |
| Validatie       | **Zod**                                                                                                |
| Charts          | **Recharts** (of een lichtgewicht alternatief), gestyled met de tokens                                 |
| Tests           | **Vitest** + Testing Library (unit/component), **Playwright** (e2e) en **pgTAP** of SQL-tests voor RLS |
| Lint/format     | ESLint + Prettier                                                                                      |
| Hosting         | **Vercel**                                                                                             |
| Package manager | pnpm                                                                                                   |

Next.js 16-conventies: de request-interceptor heet `proxy.ts` (niet `middleware.ts`). Gebruik die voor het verversen van de Supabase-sessie.

**Geen Prisma.** Het schema leeft in Supabase-migraties. Typed queries lopen via `supabase gen types typescript`.

---

## 5. Informatiearchitectuur en routes

```
/                       Home (uitgelogd: landing / ingelogd: je "cartridgekast")
/games                  Volledige database met zoeken + filters
/gb                     Game Boy-hub (groen accent)
/gbc                    Game Boy Color-hub (paars accent)
/games/[slug]           Game-detail ("manual"-pagina)
/collection             Mijn collectie (tabs: All · GB · GBC · Playing · Completed)
/wishlist               Wishlist
/stats                  Collection statistics + completion
/achievements           Achievements
/news                   Retro gaming nieuws
/u/[username]           Publiek profiel (alleen als de gebruiker het openbaar zet)
/login, /signup         Auth
/settings               Profiel, regio-voorkeur, valuta, privacy, effects/sound
/about                  Over + disclaimer + bronvermeldingen
/legal/privacy, /legal/terms
```

- **Navigatie:** op desktop een header in "behuizing"-stijl. Op mobiel een **bottom nav** die eruitziet als een D-pad/knoppenrij met 5 items: Home · Games · Collection · Wishlist · Stats.
- Alle filters en zoektermen staan in de **URL search params**, zodat je ze kunt delen en bookmarken.

---

## 6. Pagina's in detail

### 6.1 Home

**Uitgelogd:**

1. Hero in een LCD-paneel: `YOUR GAME BOY COLLECTION` / _Rediscover the games that started it all._ + CTA `PRESS START` (→ signup) en `BROWSE GAMES`
2. Twee grote tegels: **Game Boy** (groen) en **Game Boy Color** (paars), elk met het aantal games in de database
3. "On the shelf": een horizontale rij cartridge-cards met populaire of uitgelichte games
4. De zes stappen DISCOVER → … → REMEMBER als een strip in game-manual-stijl
5. Laatste nieuws (3 items)

**Ingelogd:**

1. Begroeting: `WELCOME BACK, <NAME>` + snelle stats (owned · completion % · wishlist · geschatte waarde)
2. **De cartridgekast:** je collectie als planken met cartridges op hun zijkant. Je kunt groeperen per platform en sorteren op titel/jaar/recent toegevoegd. Klik → detail.
3. "Continue playing": games met status `playing`
4. "Missing from your set": suggesties om je completion te verhogen
5. Recent behaalde achievements
6. Nieuws

### 6.2 Games-database (`/games`, `/gb`, `/gbc`)

- **Zoeken** op titel (ook alternatieve en regionale titels), publisher, developer, genre, jaar en regio
- **Filters:** platform (GB/GBC/dual-mode/GBC-only), regio (EU/US/JP), genre, jaar(bereik), publisher, developer, features (SGB enhanced, rumble, infrared, link cable), "in my collection" / "not in my collection" / "on my wishlist"
- **Sortering:** titel, releasejaar, rating, geschatte waarde, recent toegevoegd
- **Weergave:** grid van cartridge-cards óf een compacte lijst ("archive index")
- Paginering of infinite scroll met correcte focus en scroll restoration
- Elke card toont: titel, platformbadge, jaar, regio-vlaggetjes (tekstcodes, geen vlag-emoji nodig), en een "owned"-sticker of wishlist-hartje als dat van toepassing is

### 6.3 Game-detail (`/games/[slug]`)

Opgezet als een **spelboekje**:

1. **Header:** box art (of een placeholder-cartridge als die er niet is), titel, platformbadge, jaar, genre, developer/publisher, rating
2. **Acties:** `ADD TO COLLECTION` · `♥ WISHLIST` · `★ FAVORITE` · status (Backlog / Playing / Completed / Abandoned)
3. **Releases per regio:** een tabel met EU/US/JP, lokale titel, releasedatum, productcode, publisher en jouw bezit per release
4. **Do you own it?** Per release: cartridge ☐ · box ☐ · manual ☐ · conditie (Loose / Good / Very good / Mint / Sealed) · aankoopprijs · datum · notities · eigen foto's
5. **Estimated collector value:** loose / CIB / new, met bron, datum en een duidelijk label _"Estimate — not a quote"_. Erbij een kleine sparkline van de prijshistorie als die er is.
6. **Screenshots en media** in een galerij, met naamsvermelding per afbeelding
7. **Features:** SGB enhanced, rumble, IR, link cable, battery save, aantal spelers
8. **Memories:** jouw persoonlijke herinneringen (privé standaard)
9. **Related:** dezelfde serie, developer of genre

### 6.4 Collectie (`/collection`)

- Tabs: All · GB · GBC · Playing · Completed
- Weergaven: kast (visueel), grid en tabel (sorteerbaar, met CSV-export)
- Bulk-acties: status zetten, verwijderen en verplaatsen naar wishlist
- Bovenaan: completion-balk per platform

### 6.5 Wishlist (`/wishlist`)

- Prioriteit (High / Medium / Low), gewenste regio, gewenste conditie, maximale prijs en notities
- Sorteren op prioriteit, prijs en geschatte waarde
- Indicator als de geschatte waarde onder je maximale prijs zakt
- `GOT IT!` → verplaatst naar je collectie met vooringevulde gegevens

### 6.6 Stats (`/stats`)

- **Completion** per platform, per regio en per genre. De definitie staat in §9.
- Games per releasejaar (staafdiagram, GB groen / GBC paars)
- Verdeling per genre en per publisher (top 10)
- CIB-ratio (hoeveel compleet met doos en boekje)
- Geschatte totale waarde + verloop
- Gespeeld vs. backlog
- Alle grafieken hebben een tabelalternatief voor screenreaders

### 6.7 Achievements (`/achievements`)

Badge-grid als **stickervel**. Behaalde stickers zijn in kleur, de rest is grijs met een `???`-hint. Een paar voorbeelden (definieer er minimaal 25):

| Code               | Naam             | Voorwaarde                                     |
| ------------------ | ---------------- | ---------------------------------------------- |
| `first_cart`       | Insert Cartridge | Eerste game in collectie                       |
| `ten_carts`        | Shelf Starter    | 10 games                                       |
| `fifty_carts`      | Collector        | 50 games                                       |
| `cib_first`        | Complete In Box  | Eerste CIB-item                                |
| `gbc_10`           | Full Color       | 10 GBC-games                                   |
| `gb_10`            | Shades of Green  | 10 GB-games                                    |
| `jp_import`        | Import Hunter    | Eerste JP-release                              |
| `three_regions`    | World Tour       | Releases uit EU, US én JP                      |
| `year_complete`    | Time Capsule     | Alle games van één releasejaar in één regio    |
| `completed_10`     | Credits Rolled   | 10 games op Completed                          |
| `memory_5`         | Scrapbook        | 5 herinneringen geschreven                     |
| `wishlist_granted` | Wish Granted     | Een wishlist-item verplaatst naar je collectie |
| `sgb_5`            | Super Sized      | 5 SGB-enhanced games                           |

Achievements worden **server-side** berekend (database-functie of Server Action na een mutatie), nooit alleen client-side.

### 6.8 Nieuws (`/news`)

- Een feed van retro-gaming-nieuws uit RSS-bronnen die ik goedkeur (configureerbaar in `config/news-sources.ts`)
- Je slaat **alleen** titel, link, bron, datum en een korte excerpt (≤ 200 tekens) op. Geen volledige artikelen kopiëren. Klik → origineel artikel in een nieuw tabblad.
- Ophalen gebeurt via een Vercel Cron-route, maximaal elke 6 uur, met een timeout en foutafhandeling per bron

### 6.9 Profiel en instellingen

- Username, display name, avatar (pixel-avatar-picker met eigen ontworpen avatars)
- Voorkeursregio (bepaalt welke titel en box art je standaard ziet) en valuta (EUR standaard)
- Privacy: collectie privé / alleen link / openbaar
- Toggles: **Reduce effects** (scanlines, animaties) en **8-bit sounds** (standaard uit)
- Export van alle eigen data (JSON + CSV) en account verwijderen (AVG)

---

## 7. Datamodel (Supabase Postgres)

Schrijf dit als SQL-migraties. Gebruik `uuid` PK's (`gen_random_uuid()`), `created_at`/`updated_at` met een trigger, en een `slug` waar het nodig is.

### Enums

```sql
create type platform as enum ('gb', 'gbc');
create type cart_compat as enum ('gb', 'gbc_dual', 'gbc_only'); -- grijs / zwart / transparant
create type region as enum ('eu', 'us', 'jp');
create type item_condition as enum ('loose', 'good', 'very_good', 'mint', 'sealed');
create type play_status as enum ('backlog', 'playing', 'completed', 'abandoned');
create type media_kind as enum ('boxart_front', 'boxart_back', 'cartridge', 'manual', 'screenshot', 'title_screen');
create type price_grade as enum ('loose', 'cib', 'new');
create type wish_priority as enum ('high', 'medium', 'low');
create type visibility as enum ('private', 'unlisted', 'public');
```

### Catalogus (publiek leesbaar, alleen schrijfbaar door service role / admin)

- `companies` (id, name, slug, country)
- `genres` (id, name, slug)
- `series` (id, name, slug)
- `games` (id, slug, title, platform, compat, series_id, developer_id, description, players_min, players_max, sgb_enhanced, rumble, infrared, link_cable, battery_save, igdb_id, external_ids jsonb, search tsvector, …)
- `game_genres` (game_id, genre_id)
- `releases` (id, game_id, region, local_title, release_date (nullable), release_date_precision (`day|month|year`), product_code, publisher_id, …). **Uniek:** (game_id, region, product_code)
- `media` (id, game_id, release_id nullable, kind, url, width, height, source, source_url, license, attribution, …)
- `price_points` (id, release_id, grade, value_cents, currency, source, observed_at). Index op (release_id, grade, observed_at desc)

### Gebruiker (RLS: alleen eigenaar, tenzij het profiel openbaar is)

- `profiles` (id = `auth.users.id`, username uniek, display_name, avatar_key, preferred_region, currency, visibility, reduce_effects, sounds_enabled)
- `collection_items` (id, user_id, release_id, has_cart, has_box, has_manual, condition, purchase_price_cents, purchase_currency, purchased_on, notes, photo_paths text[]). Meerdere exemplaren van dezelfde release mogen.
- `wishlist_items` (id, user_id, game_id, preferred_region nullable, desired_condition nullable, max_price_cents, priority, notes). **Uniek:** (user_id, game_id)
- `ratings` (user_id, game_id, score 1–10, is_favorite). PK (user_id, game_id)
- `play_logs` (id, user_id, game_id, status, started_on, finished_on, hours, notes). **Uniek:** (user_id, game_id)
- `memories` (id, user_id, game_id, body ≤ 2000 tekens, year_remembered nullable, is_public bool default false)
- `achievements` (code PK, name, description, icon_key, platform nullable, sort)
- `user_achievements` (user_id, achievement_code, unlocked_at). PK (user_id, achievement_code)

### Nieuws

- `news_sources` (id, name, feed_url, site_url, enabled)
- `news_items` (id, source_id, title, url uniek, excerpt, published_at, fetched_at)

### Zoeken

- Extensies: `pg_trgm` + `unaccent`
- `games.search` = gewogen tsvector over title (A), local_titles (A), developer/publisher (B), genres (C)
- Een GIN-index op `search` en een trigram-index op `title` (voor typo-tolerantie en autocomplete)
- Een RPC `search_games(q, filters jsonb, sort, page, page_size)` die resultaten plus het totaal teruggeeft

### Views en functies

- `v_user_completion` (user_id, platform, region, owned_count, total_count, pct)
- `v_user_collection_value` (user_id, estimated_cents) op basis van het meest recente prijspunt per release en grade
- `fn_evaluate_achievements(user_id)` geeft de nieuw behaalde codes terug

### Row Level Security (verplicht op álle tabellen)

- Catalogus- en nieuwstabellen: `select` voor `anon` en `authenticated`. Geen insert/update/delete behalve via de service role.
- Gebruikerstabellen: `select/insert/update/delete` alleen waar `user_id = auth.uid()`. Daarnaast `select` voor anderen als `profiles.visibility = 'public'` (en voor `memories` alleen als `is_public` aan staat).
- Storage-bucket `collection-photos`: privé, met het pad `user_id/...`. Alleen de eigenaar mag lezen en schrijven.
- **Schrijf tests** die bewijzen dat gebruiker A de data van gebruiker B niet kan lezen of wijzigen.

---

## 8. Data, API's en licenties

Bouw elke externe bron achter een **provider-interface**, zodat bronnen uitwisselbaar zijn en je in development met seed-data werkt:

```ts
interface CatalogProvider { searchGames(...); getGame(...); listReleases(...); }
interface MediaProvider   { getMedia(gameId): Promise<MediaAsset[]>; }
interface PriceProvider   { getPrices(releaseId): Promise<PricePoint[]>; }
interface NewsProvider    { fetchFeed(source): Promise<NewsItem[]>; }
```

| Doel                     | Kandidaat-bronnen                                                        | Opmerkingen                                                                                        |
| ------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Metadata en games        | IGDB (via Twitch-API) · TheGamesDB · MobyGames API                       | Check per bron de voorwaarden voor opslag, cachen en weergeven. Vermeld de bron.                   |
| Releases en productcodes | No-Intro DAT-metadata (alleen titels, regio's en hashes, **nooit** ROMs) | Gebruik de DAT als checklist voor completeness                                                     |
| Box art en screenshots   | IGDB · TheGamesDB · ScreenScraper · eigen uploads van gebruikers         | Alleen tonen als de licentie of voorwaarden dat toestaan. Altijd `source` + `attribution` opslaan. |
| Prijzen                  | PriceCharting API (betaald) · handmatige invoer door admin               | Altijd tonen als _estimate_ met bron en datum                                                      |
| Nieuws                   | RSS-feeds van retro-gamingsites                                          | Alleen titel, link en korte excerpt                                                                |

**Regels:**

- API-sleutels staan alleen server-side (`process.env`) en komen nooit in de client-bundle
- Respecteer de rate limits. Cache responses in de database en laat de site nooit live van een externe API afhangen om een pagina te renderen.
- Schrijf een import-script (`scripts/import-catalog.ts`) dat idempotent is (upsert op externe ID's) en een dry-run-modus heeft
- **Seed:** ±40 echte, bekende GB/GBC-titels met alleen gegevens waar je zeker van bent. Laat velden leeg (`null`) in plaats van te gokken. Prijzen in de seed zijn duidelijk nep (`source: 'seed'`) en worden in de UI ook zo gelabeld.
- Geen afbeeldingen meeleveren die je niet mag gebruiken. Gebruik anders een gegenereerde **placeholder-cartridge** met de titel op het label.

---

## 9. Bedrijfsregels

- **Owned:** een gebruiker "bezit" een game als er ≥ 1 `collection_item` is voor een release van die game
- **Completion:** `owned games / total games` binnen een scope (platform, regio of genre). Per regio telt alleen een release uit díé regio.
- **CIB:** `has_cart && has_box && has_manual`
- **Collectiewaarde:** per item de meest recente `price_point` voor de release en de grade (CIB als het item CIB is, `new` als het sealed is, anders `loose`). Ontbreekt die prijs? Dan telt het item niet mee en toon je "N items without price data".
- **Valuta:** bedragen sla je op in centen met een valutacode. Omrekenen alleen voor weergave, met een vermelding van de koers en de datum.
- **Datums:** releasedatums kunnen onvolledig zijn. Toon dan alleen het jaar of jaar + maand, afhankelijk van `release_date_precision`.

---

## 10. Componentenbibliotheek

Bouw deze als herbruikbare, getypeerde componenten in `components/ui` en `components/retro`, elk met een korte story of voorbeeldpagina op `/dev/components` (alleen in development):

- `AppShell`, `ShellHeader`, `BottomDPadNav`, `Footer` (met disclaimer)
- `LcdPanel` (met optionele scanlines en "pixel-fade-in")
- `CartridgeCard` (varianten: `gb` grijs, `gbc_dual` zwart, `gbc_only` transparant · sizes: sm/md/lg · states: owned, wishlisted, loading-skeleton)
- `CartridgeShelf` (de kast: virtualized bij grote collecties)
- `PlatformBadge`, `RegionTag`, `Sticker` (CIB, IMPORT, SGB, RUMBLE, PRICE)
- `PixelButton` (primary/secondary/ghost, press-animatie), `PixelToggle`, `PixelCheckbox`
- `PixelProgress` (blokjes die vollopen, met een numerieke waarde voor screenreaders)
- `ManualSection` (genummerde "page"-sectie met kader op papier)
- `StatTile`, `ChartFrame` (met een tabel-fallback)
- `EmptyState` (LCD-stijl), `LoadingState` (power-LED + `LOADING…`), `ErrorState` (`GAME OVER`)
- `SearchBar` met autocomplete (trigram), `FilterDrawer` (op mobiel een sheet)
- `AchievementSticker`, `Toast` (`PROGRESS SAVED`)
- `PixelAvatar`

Alle interactieve componenten:

- zijn volledig met het toetsenbord te bedienen en hebben zichtbare focus (pixel-outline)
- hebben correcte ARIA-rollen en -labels
- respecteren `prefers-reduced-motion` en de instelling _Reduce effects_

---

## 11. Kwaliteitseisen

### Toegankelijkheid

- WCAG 2.2 AA. Contrast controleren voor álle tokencombinaties die je gebruikt.
- Pixel-fonts nooit voor lange tekst. Minimale tekstgrootte 16px voor bodytekst.
- Grafieken hebben altijd een tekst- of tabelalternatief

### Performance

- LCP < 2.5s op een mid-range mobiel, CLS < 0.1
- Afbeeldingen via `next/image` met juiste `sizes`. Pixel-art met `image-rendering: pixelated`.
- Database-lijsten zijn gepagineerd. Zware queries gaan via RPC's en indexen.
- Catalogus-pagina's worden statisch of ISR gerenderd waar dat kan. Gebruikersdata wordt dynamisch gerenderd.

### Security

- RLS op alles (zie §7). Server Actions valideren input met Zod en checken de auth.
- Secret keys alleen op de server. De publishable key mag in de client.
- Rate limiting op auth en schrijfacties
- Uploads: alleen afbeeldingen, maximaal 5 MB, EXIF strippen
- CSP-headers, `next.config` security headers

### Privacy

- Standaard is alles privé. Openbaar maken is een bewuste keuze.
- Data-export en account verwijderen werken echt (cascade + storage opruimen)
- Geen tracking van derden zonder toestemming. Vercel Analytics (privacyvriendelijk) mag.

### SEO

- Metadata per game-pagina (titel, beschrijving, OG-afbeelding die je dynamisch genereert met de cartridge-placeholder)
- `sitemap.xml` en `robots.txt`. Gebruikers- en settingspagina's staan op `noindex`.

---

## 12. Testing

- **Unit (Vitest):** bedrijfsregels uit §9 (completion, CIB, waarde, datumweergave), Zod-schema's, achievement-evaluatie en zoekquery-builders
- **Component (Testing Library):** CartridgeCard-varianten, PixelProgress, FilterDrawer en toegankelijkheid (axe)
- **Database:** RLS-tests (gebruiker A ≠ gebruiker B, anon kan geen gebruikersdata lezen) en de `search_games`-RPC
- **E2E (Playwright):** signup → game zoeken → toevoegen aan collectie → completion stijgt → wishlist → `GOT IT!` → achievement unlocked
- **CI:** een GitHub Actions-workflow die lint, typecheck, unit tests en build draait bij elke PR. E2E draait tegen een lokale Supabase (`supabase start`).

---

## 13. Omgevingen en deployment

### Resources (alleen deze!)

- **GitHub:** `mvangraas/save-slot`
- **Vercel:** project **`save-slot`** in team **Merijn'Biz**
- **Supabase:** een **eigen project** voor Save Slot in organisatie **MerijnBiz**. Dat is dezelfde organisatie als BrickFigLy, maar een **ander project**. Raak het BrickFigLy-project nooit aan.

### Env vars (`.env.example` meeleveren, nooit echte waarden committen)

```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=            # server-only
IGDB_CLIENT_ID=                 # server-only, optioneel
IGDB_CLIENT_SECRET=             # server-only, optioneel
PRICECHARTING_API_KEY=          # server-only, optioneel
CRON_SECRET=                    # beveiligt /api/cron/*
```

### Deploystappen

1. Supabase-project aanmaken (MerijnBiz) → migraties toepassen (`supabase db push`) → seed draaien
2. Auth-instellingen: site-URL en redirect-URL's voor production en preview
3. Vercel-project `save-slot` koppelen aan de GitHub-repo, env vars zetten voor Production en Preview
4. Vercel Cron instellen voor `/api/cron/news` (elke 6 uur) en eventueel `/api/cron/prices` (dagelijks)
5. Pre-launch checklist: RLS-tests groen, Lighthouse ≥ 90 (perf, a11y, best practices, SEO), disclaimer zichtbaar, bronvermeldingen kloppen en geen ongelicenseerde afbeeldingen
6. Eigen domein (later)

---

## 14. Bouwfases

Stop na elke fase en lever een rapport (§0).

### Fase 1 — Fundament

- Next.js 16 + TS + Tailwind v4 + ESLint/Prettier + Vitest + Playwright
- Design tokens, fonts, light/dark, `AppShell` met header + bottom nav + footer-disclaimer
- Supabase lokaal (`supabase init`), `@supabase/ssr`-clients (server/browser) en `proxy.ts`
- Kerncomponenten: `LcdPanel`, `CartridgeCard`, `PixelButton`, `PlatformBadge`, `Sticker`, `EmptyState`, `LoadingState`, `ErrorState`
- `/dev/components`-pagina
- **Klaar wanneer:** `pnpm build`, lint, typecheck en tests groen zijn, en de componentpagina werkt in light + dark

### Fase 2 — Database en catalogus

- Alle migraties uit §7, inclusief RLS, indexen, views en RPC's
- Gegenereerde types en de provider-interfaces uit §8
- Seed met ±40 titels + placeholder-media
- `/games`, `/gb`, `/gbc` met zoeken, filters, sortering en paginering
- `/games/[slug]` (read-only gedeelte)
- **Klaar wanneer:** zoeken op titel, publisher, genre, jaar en regio werkt, en de RLS-tests groen zijn

### Fase 3 — Auth en collectie

- Signup/login (magic link + wachtwoord), profiel, settings
- Collectie toevoegen, bewerken en verwijderen per release (cart/box/manual/conditie/prijs/foto's)
- `/collection` met kast-, grid- en tabelweergave + CSV-export
- Ratings/favorieten, play-status, memories
- Homepage voor ingelogde gebruikers met de cartridgekast
- **Klaar wanneer:** de e2e-flow signup → toevoegen → zichtbaar in kast slaagt

### Fase 4 — Wishlist, completion en stats

- `/wishlist` incl. `GOT IT!`-flow
- Completion-views en `/stats` met alle grafieken + tabelfallbacks
- Collectiewaarde (met seedprijzen, gelabeld)

### Fase 5 — Achievements en polish

- ≥ 25 achievements, server-side evaluatie, stickervel en unlock-toast
- 8-bit micro-interactions, optionele sounds, retro loading states
- Lege staten, 404/500 in `GAME OVER`-stijl

### Fase 6 — Externe data en nieuws

- Echte providers (IGDB/TheGamesDB/prijsbron) achter feature flags, met een import-script (idempotent, dry-run)
- RSS-nieuws + cron
- Bronvermeldingen op `/about`

### Fase 7 — Hardening en deploy

- Security headers/CSP, rate limiting, data-export en account verwijderen
- Lighthouse en axe op alle hoofdpagina's
- GitHub Actions CI
- Deploy naar Vercel `save-slot` + Supabase-project (MerijnBiz), en de pre-launch checklist uit §13

---

## 15. Buiten scope (voor nu)

- Emulatie, ROMs of links naar ROMs, in welke vorm dan ook
- Een webshop of betalingen. Wel zo bouwen dat dit later kan als aparte module.
- Game Boy Advance, DS of andere platformen. Zorg wel dat het `platform`-enum later uitbreidbaar is.
- Sociale features zoals volgen, reacties en ruilen. Alleen openbare profielen in v1.

---

## 16. Definition of Done (elke fase)

- [ ] Build, lint, typecheck en alle tests zijn groen
- [ ] Werkt op 360px mobiel én desktop, in light en dark
- [ ] Toetsenbord-navigatie en screenreader-labels zijn gecontroleerd
- [ ] Geen secrets in de code, `.env.example` is bijgewerkt
- [ ] Geen verwijzingen naar BrickFigLy-resources
- [ ] Rapport `reports/PHASE_<n>_REPORT.md` geschreven (in het Nederlands)

**Begin nu met Fase 1.**
