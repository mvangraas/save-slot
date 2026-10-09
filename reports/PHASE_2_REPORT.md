# Fase 2 — Database en catalogus · rapport

**Status:** klaar, wacht op jouw akkoord voor fase 3.

## Supabase

Ik heb het bestaande lege project **Save-slot** gebruikt (`stvjldcxadrbcnodvhop`, eu-west-1, organisatie Merijn'Biz). Ik heb dus geen nieuw project aangemaakt. Het BrickFigLy-project heb ik niet aangeraakt.

Er zijn 7 migraties toegepast (staan ook in `supabase/migrations/`):

| Migratie                | Inhoud                                                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extensions_and_enums`  | `pg_trgm` en `unaccent`, alle enums uit §7, en hulpfuncties voor accent-ongevoelig zoeken                                                                                                           |
| `catalog`               | `companies`, `genres`, `series`, `games`, `game_genres`, `releases`, `media` en `price_points`, met indexen en triggers die het eerste releasejaar, de regio's en de zoektekst bijhouden            |
| `user_data`             | `profiles` (wordt automatisch aangemaakt bij signup), `collection_items`, `wishlist_items`, `ratings`, `play_logs`, `memories`, `achievements`, `user_achievements`, `news_sources` en `news_items` |
| `rls`                   | RLS op **alle** tabellen, plus de privé-bucket `collection-photos` (pad `user_id/…`, max 5 MB, alleen afbeeldingen)                                                                                 |
| `search_and_views`      | RPC `search_games`, RPC `catalog_facets`, en de views `v_my_completion` en `v_my_collection_value`                                                                                                  |
| `search_typo_tolerance` | Typfout-tolerantie afgesteld: "tetirs" vindt nu Tetris. Staat uit bij korte zoektermen.                                                                                                             |
| `private_helpers`       | De RLS-hulpfunctie verhuisd naar een niet-publiek schema (advies van de Supabase security-advisor)                                                                                                  |

**Seed:** 39 games (24 GB, 15 GBC: 6 dual-mode en 9 GBC-only), 103 releases, 12 bedrijven, 9 genres en 14 series. Alleen feiten waar ik zeker van ben:

- releasejaren alleen op jaarniveau
- Japanse titels waar ik die zeker wist
- features alleen als `true` wanneer bevestigd, anders "onbekend"
- geen prijzen, productcodes of afbeeldingen

De bron is `src/data/seed/catalog.ts`. `pnpm seed:generate` maakt daar `supabase/seed.sql` van. Dat script kun je veilig opnieuw draaien.

**Advisors:** de security-advisor geeft 0 meldingen. De performance-advisor meldt alleen "ongebruikte index", wat normaal is voor een nieuwe database.

## App

- **`/games`:** zoeken en filteren.
  - Zoeken werkt op titel, Japanse titel, developer, publisher, genre en serie, ongevoelig voor accenten: "pokemon" vindt Pokémon. De zoekbalk heeft autocomplete.
  - Filters: platform, carttype (grijs, dual-mode of GBC-only), regio, genre, jaarbereik, publisher, developer, serie en features. Een filter wordt meteen toegepast zodra je een vinkje of keuze verandert.
  - Je kunt sorteren op titel, jaar, recent toegevoegd en beste match.
  - Twee weergaven: **Shelf** (cartridges) en **Index** (tabel).
  - Paginering met 24 per pagina. Actieve filters staan als chips die je met één klik weghaalt.
  - Alles staat in de URL, dus elke zoekopdracht is te delen.
- **`/gb` en `/gbc`:** platform-hubs met een eigen LCD-header (groen of paars) en dezelfde browser, met het platform vast ingesteld.
- **`/games/[slug]`:** de detailpagina in spelboekje-stijl.
  - 01 Releases per regio, met lokale titel, jaar, code en publisher
  - 02 Cartridge-features
  - 03 Box art en screenshots (nu "nog geen gelicenseerde beelden")
  - "More from <serie>"
  - Links naar developer, publisher, genre en serie openen meteen een gefilterde zoekopdracht.
  - Alle 39 pagina's worden vooraf statisch gebouwd.
- **Homepage:** de plank toont nu echte games uit de catalogus (de oudste eerst) en de tegels tonen het aantal games per platform.
- **Provider-laag (§8):** de interface `CatalogProvider` heeft twee implementaties: **Supabase** (RPC's en PostgREST) en **seed** (in het geheugen). Zonder Supabase-config draait de app volledig op de seed. Catalogusdata wordt een uur gecachet (`'use cache'`, tag `catalog`).
- **API:** `/api/search/suggest?q=` voor de autocomplete.
- **Nieuw component:** `ManualSection` (genummerde boekjespagina).

## Tests

| Soort                               | Resultaat             |
| ----------------------------------- | --------------------- |
| Unit en component (Vitest)          | **86 groen** (was 48) |
| E2E (Playwright, desktop en mobiel) | **42 groen** (was 20) |
| RLS-tests tegen de echte database   | **16/16 groen**       |
| Lint, typecheck, Prettier, build    | groen                 |

- **Nieuwe unit-tests:** URL-parsing (inclusief rommel in de URL), serialisatie, de zoeklogica, de integriteit van de seed-data en het opschonen van filter-URL's.
- **Pariteit:** de zoekresultaten van de seed-provider zijn getest tegen dezelfde aantallen die `search_games` in Supabase gaf (bijvoorbeeld "pokemon" = 8, JP+RPG = 8, GBC-only = 9). Lokaal en productie gedragen zich dus hetzelfde.
- **Nieuwe e2e-tests:** zoeken, autocomplete naar een detailpagina, filters en chips, de index-weergave, de platform-hub, de detailpagina, een onbekende game (GAME OVER), en axe op 4 nieuwe pagina's.
- **RLS:** `supabase/tests/rls_test.sql` controleert onder andere:
  - gebruiker A ziet en wijzigt de collectie van B niet
  - A kan geen item op naam van B zetten
  - niemand kan naar de catalogus schrijven
  - anoniem ziet geen privé-profielen of -collecties
  - een publiek profiel toont wel de collectie, maar alleen publieke herinneringen
  - het zoekfilter "owned" en de completion-view werken per gebruiker

  Het script draait altijd terug, dus het laat niets achter. Via de Supabase-tool kon ik 16 van de 17 checks draaien: de delete-check vraagt in die tool om bevestiging. Die draait in CI (fase 7).

- **Live gecontroleerd via de REST API:** de detail-query met alle joins werkt, typfouten worden gevonden, anoniem schrijven geeft 401 en de RLS-hulpfunctie is niet meer publiek bereikbaar.

## Afwijkingen van het plan en waarom

1. **Zoeken met trigram in plaats van een tsvector.** Voor korte gametitels werkt "elk woord moet voorkomen + trigram-gelijkenis" beter: je krijgt typfout-tolerantie en gedeeltelijke woorden ("zeld" vindt Zelda). De index is `gin_trgm_ops` op een genormaliseerde zoektekst.
2. **Features zijn `null` = onbekend.** Zo hoeft de seed niets te gokken. Filteren op een feature toont alleen games waarvan die feature bevestigd is.
3. **De views heten `v_my_completion` en `v_my_collection_value`.** Ze geven alleen data van de ingelogde gebruiker (security invoker) in plaats van alle gebruikers. Dat is veiliger.
4. **`fn_evaluate_achievements` schuift door naar fase 5.** Daar worden de achievements gedefinieerd. De tabellen bestaan al.
5. **Release-uniekheid** is (game, regio, productcode). Een onbekende code telt als één release per regio.
6. **Het lokaal testen gebeurt met de seed.** Deze sandbox kan supabase.co niet bereiken, dus build en e2e draaien op de seed-provider. De Supabase-kant heb ik apart gecontroleerd met SQL, de advisors en de live REST API.

## Wat nog openstaat

- **Vercel env vars:** zet `NEXT_PUBLIC_SUPABASE_URL` en `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in het Vercel-project `save-slot`. Dat doe ik in fase 7, of eerder als je dat wilt.
- **Afbeeldingen:** er zijn nog geen afbeeldingen. Die komen met de externe bronnen in fase 6.
- **Sitemap en OG-afbeeldingen** volgen in fase 7.

## BrickFigLy-check

Er zijn geen verwijzingen in code, config of database. Alles staat in het eigen Supabase-project "Save-slot".

## Screenshots

`reports/phase-2/`: games (shelf), filters met index-weergave, de GBC-hub (light), de detailpagina (dark, light en mobiel).
