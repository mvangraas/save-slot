# Fase 7 — Hardening en deploy

## Wat is er gebouwd

**Beveiliging**

- Security headers op elke response (`src/config/security-headers.ts`):
  - **Content-Security-Policy**, met deze regels:
    - geen scripts van andere domeinen
    - geen `<object>` of frames
    - `frame-ancestors 'none'`
    - formulieren alleen naar de eigen site
    - afbeeldingen alleen van de eigen site, Supabase en IGDB
  - HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy (camera/microfoon/locatie uit), COOP
  - de `X-Powered-By`-header is weg
- **Rate limiting**:
  - Opslaan: max. 120 wijzigingen per minuut per gebruiker. Dit gebeurt in de database (`public.check_rate_limit`), dus het werkt over alle serverinstanties heen. Elke Server Action controleert dit vóór het schrijven.
  - Inloggen, registreren en de magic link: max. 10 pogingen per 10 minuten per IP. Supabase Auth heeft daarbovenop eigen limieten.
- **Uploads**:
  - Alleen echte JPEG/PNG/WebP. Het type wordt gecontroleerd op de bytes, niet op de bestandsnaam.
  - Max. 5 MB.
  - Elke foto wordt opnieuw gecodeerd naar WebP (max. 1600 px), automatisch rechtgezet, en **alle metadata (EXIF, inclusief GPS) gaat eraf**.

**Foto's van je eigen exemplaren** (uit fase 2 doorgeschoven)

- Op de gamepagina kun je per exemplaar max. 4 foto's toevoegen of verwijderen.
- Ze staan in de privé-bucket `collection-photos`, in de map `<jouw id>/…`. Alleen jij kunt ze zien:
  - De route `/collection/photo` controleert de eigenaar en geeft een signed URL die 60 seconden geldig is.
  - Een database-check zorgt dat een exemplaar alleen paden uit je eigen map kan bevatten.

**Privacy**

- Instellingen → **Your data**: download alles in één JSON-bestand:
  - profiel, collectie, wishlist, ratings, speelstatus, herinneringen en achievements
  - plus de bestaande CSV-export
- Instellingen → **Delete account**: typ `DELETE` ter bevestiging.
  - Eerst gaan je foto's uit de opslag.
  - Daarna wordt het account verwijderd via de Supabase Auth admin-API. Alle tabellen ruimen automatisch mee op (cascade).
  - Tot slot zie je het scherm "SAVE FILE ERASED".

**SEO**

- `sitemap.xml`: alle openbare pagina's en elke game.
- `robots.txt`: persoonlijke pagina's, `/api` en `/dev` zijn uitgesloten. Die pagina's hadden al `noindex`.
- Per game een dynamische OG-afbeelding: een eigen cartridge-placeholder met de titel, geen box art of logo's.

**CI**

- `.github/workflows/ci.yml` draait bij elke push/PR:
  - format-check, lint, typecheck, unit-tests en build
  - daarna de volledige Playwright-suite (desktop + mobiel)

**Polish**

- In de unlock-toast is de GB-sticker nu omgekeerd gekleurd, zodat hij opvalt op de groene toast.

## Supabase (project Save-slot `stvjldcxadrbcnodvhop`)

- Migratie `20261012090000_hardening.sql` is toegepast:
  - `private.rate_limits` + `public.check_rate_limit()`
  - `private.photo_paths_ok()` + een check-constraint op `collection_items.photo_paths`
- **Live getest** met een tijdelijke gebruiker in een transactie die daarna is teruggedraaid:
  - limiet 2 gaf `true, true, false`
  - een eigen pad gaf `true`, een vreemd pad gaf `false`
- De foto-bucket en zijn policies bestonden al sinds fase 2.

## Tests en kwaliteit

- `pnpm check`: lint, typecheck, **162 unit-tests** en de build zijn groen. Nieuw:
  - foto-verwerking (EXIF wordt gestript, nep-afbeeldingen, te groot, afgekapt)
  - rate limiter
  - CSP/headers
- `pnpm test:e2e`: **94 e2e-tests** groen. Nieuw:
  - security headers
  - foto uploaden, EXIF weg, een ander kan de foto niet zien, verwijderen
  - data-export (JSON-inhoud gecontroleerd)
  - account verwijderen, daarna kan inloggen niet meer
  - **axe-sweep** over alle hoofdpagina's (WCAG 2.2 AA), uitgelogd en ingelogd, in licht én donker thema: 0 problemen
- **Lighthouse** (mobiel, gesimuleerde trage 4G, lokale productiebuild):

  | Pagina          | Perf | A11y | Best practices | SEO |
  | --------------- | ---- | ---- | -------------- | --- |
  | `/`             | 91   | 100  | 100            | 100 |
  | `/games`        | 94   | 100  | 96             | 100 |
  | `/games/tetris` | 92   | 100  | 100            | 100 |
  | `/news`         | 95   | 100  | 100            | 100 |
  | `/about`        | 93   | 100  | 100            | 100 |
  - CLS is overal 0.
  - LCP zit onder gesimuleerde trage 4G op 2,4–3,0 s.
  - De 96 op `/games` komt door de bewust kleine pixeltekst op de cartridge-labels. Elke cartridge heeft een volledig `aria-label`.

## Afwijkingen en keuzes

- De CSP staat inline scripts toe (`'unsafe-inline'`), omdat de pagina's statisch/gedeeltelijk vooraf worden gerenderd. Een nonce per request zou elke pagina dynamisch maken. Alle andere bronnen zijn dichtgezet.
- De auth-limiet per IP leeft in het geheugen per serverinstantie. De echte bescherming komt van Supabase Auth.
- CI draait de e2e-tests tegen de in-memory backend in plaats van tegen een lokale Supabase (`supabase start`). Docker is niet beschikbaar in mijn omgeving, en zo heeft CI geen secrets nodig. De RLS-tests staan in `supabase/tests/rls_test.sql`.
- De geluidsvoorkeur blijft per apparaat (localStorage). Die wordt niet gesynchroniseerd naar het profiel.

## Pre-launch checklist (§13)

- [x] RLS op alle tabellen, met tests (fase 2) en live gecontroleerd
- [x] Lighthouse ≥ 90 op perf, a11y, best practices en SEO voor alle gemeten pagina's
- [x] Disclaimer zichtbaar (footer + /about)
- [x] Bronvermeldingen kloppen (/about toont live welke bronnen data leveren)
- [x] Geen ongelicenseerde afbeeldingen (alleen eigen placeholders; IGDB-covers alleen met vermelding)
- [x] Security headers, rate limiting, data-export en account verwijderen
- [x] Cron voor nieuws actief
- [ ] **Jij:** Supabase → Authentication → **Leaked password protection** aanzetten (advisor-melding)
- [ ] **Jij:** in Vercel `NEXT_PUBLIC_SITE_URL=https://save-slot-merijn-biz.vercel.app` zetten, of later je eigen domein. Zonder deze variabele valt de site automatisch terug op het Vercel-productieadres.
- [ ] Later: eigen domein, en IGDB-/PriceCharting-sleutels

## BrickFigLy-check

- Er is niets van BrickFigLy gebruikt of aangeraakt. Alle databasewijzigingen zijn alleen op `stvjldcxadrbcnodvhop` gedaan.

## Screenshots

`reports/phase-7/`:

- `settings.png` (Your data + Delete account)
- `photos.png` (foto bij een exemplaar)
- `og-image.png` (OG-afbeelding van een game)
