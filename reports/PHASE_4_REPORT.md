# Fase 4 — Wishlist, statistieken en collectiewaarde

## Wat is er gebouwd

**Wishlist (`/wishlist`)**

- Per wens: prioriteit (low/medium/high/grail), voorkeursregio, gewenste staat, maximale prijs en notities (bewerken inline).
- Sorteren op prioriteit, max-prijs, geschatte prijs of recent toegevoegd.
- Schatting = goedkoopste release in de voorkeursregio (of alle regio's) voor de gewenste staat. Ligt die onder je max, dan verschijnt de sticker **BELOW YOUR MAX** en de teller "N BELOW MAX".
- **GOT IT!**-flow: kies release/staat/prijs (vooraf ingevuld), het exemplaar komt in je collectie en de wens verdwijnt ("WISH GRANTED").

**Statistieken (`/stats`)**

- Tegels: games, exemplaren + CIB-aandeel, geschatte waarde (met demo-label), totaal betaald.
- Completion per platform, per regio en per genre (PixelProgress-balken).
- Staafdiagram per releasejaar (GB/GBC, gevalideerd palet voor licht én donker), top-10 uitgevers en speelstatus.
- Elke grafiek heeft "Show as table" en er is een losse "Completion as tables"-weergave.

**Collectiewaarde**

- Gamepagina: nieuwe sectie 3 "Estimated collector value" met loose / CIB / new per regio.
- Home (My Cabinet): tegel "Est. value".
- Collectie-tabel: kolom geschatte waarde per exemplaar.
- Grade-regel: sealed → new, doos + handleiding → CIB, anders loose.

**Bulkacties (uit fase 3 doorgeschoven)**

- `/collection?view=table`: checkboxes en select-all, plus de acties: verwijderen, naar wishlist, playing/completed/backlog.

## Data en Supabase (project Save-slot `stvjldcxadrbcnodvhop`)

- 309 demo-prijspunten (`source='seed'`, `observed_at` 2026-10-01). Ze komen deterministisch uit `src/data/seed/prices.ts` en `scripts/generate-seed.mts`.
- Migratie `20261010120000_facets_region_counts.sql`: `catalog_facets` geeft nu `region_counts` terug (eu 26, us 39, jp 38). Een unit-test borgt dat seed en Supabase hierin gelijk zijn.
- De queries zijn live gecontroleerd: price-embed, wishlist en region_counts gaven allemaal 200 met correcte data.

## Tests

- `pnpm check`: lint, typecheck, **116 unit-tests** en de build zijn groen.
- `pnpm test:e2e`: **68 e2e-tests** groen (desktop + mobiel), waaronder:
  - wishlist bewerken / bargain / GOT IT
  - stats + axe
  - bulkacties
  - demo-prijzen op de gamepagina

## Afwijkingen en keuzes

- **Prijzen zijn demo-data**, overal zichtbaar gelabeld ("Demo prices — not real market data"). Echte prijsbronnen komen in fase 6.
- De waarde wordt in de app berekend (`src/lib/backend/value.ts`) in plaats van via de SQL-view `v_my_collection_value`. Zo werken seed, memory en Supabase identiek; de view blijft bestaan.
- Wishlist-schatting = goedkoopste release. Er is nog geen prijsgeschiedenis.
- Bekend cosmetisch punt: lange titels breken op het kleine cartridge-label midden in een woord. Dit wordt opgepakt in fase 5 (polish).

## BrickFigLy-check

- Er is geen code, env, Supabase-project of Vercel-project van BrickFigLy gebruikt of aangeraakt.
- Alle databasewijzigingen zijn alleen op `stvjldcxadrbcnodvhop` gedaan.

## Screenshots

`reports/phase-4/`:

- `wishlist.png`
- `stats.png`
- `stats-light.png`
- `stats-m.png`
- `value.png`
- `table.png`

## Volgende fase

Fase 5: achievements (`fn_evaluate_achievements`), animaties/geluid en polish.
