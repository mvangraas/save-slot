# Fase 3 — Auth en collectie · rapport

**Status:** klaar, wacht op jouw akkoord voor fase 4.

## Wat er gebouwd is

**Inloggen**
- `/login` heeft drie tabs:
  - **Sign in**: e-mail en wachtwoord
  - **New save file**: account aanmaken, minimaal 8 tekens
  - **E-mail link**: magic link, alleen bij Supabase
- `/auth/callback` regelt de bevestigingsmail en de magic links (PKCE-code-exchange).
- Na het inloggen ga je terug naar de pagina waar je was (`?next=`). Dat werkt alleen voor interne paden, zodat niemand je via een link naar een externe site kan doorsturen.
- De header toont "P1 · naam" met een link naar je instellingen, en anders "Sign in".

**`/settings`:** gebruikersnaam (uniek), weergavenaam, voorkeursregio, wie je collectie mag zien (alleen ik / met link / openbaar) en uitloggen.

**Gamepagina (alleen als je ingelogd bent)**
- **Snelknoppen:** ♡ Wishlist, ☆ Favorite, Rating (1–10) en Play-status (Backlog / Playing / Completed / Abandoned). Je wijziging wordt meteen opgeslagen.
- **04 Your copies:** per exemplaar leg je vast welke release (regio), cartridge / doos / handleiding, conditie, aankoopprijs, datum en notities. Je kunt exemplaren bewerken en verwijderen.
- **05 Memories:** herinneringen met een jaartal. Ze zijn standaard privé, met een vinkje maak je ze openbaar. Je kunt ze ook verwijderen.
- Uitgelogd zie je "Sign in to collect".

**`/collection`**
- Tabs: All, GB, GBC, Playing en Completed.
- Weergaven:
  - **Shelf:** de cartridgekast, per platform op planken
  - **Grid**
  - **Table:** elk exemplaar met cart, doos, handleiding, conditie, prijs en datum
- **Completion-balken** per platform (pixelblokjes, toegankelijk als progressbar).
- **Export CSV** (`/collection/export`). Celinhoud die met `=`, `+`, `-` of `@` begint, wordt onschadelijk gemaakt, zodat een spreadsheet er geen formule van maakt.
- Als je nog niets hebt, zie je `NO DATA ON THIS SAVE FILE`.

**Homepage (ingelogd)**
- "WELCOME BACK, …"
- Tegels met het aantal games, exemplaren, games die je speelt en je wishlist.
- Completion-balken, je cartridgekast (de laatste 16) en "Continue playing".
- Uitgelogd blijft de homepage zoals hij was.

**Nieuwe componenten:** `PixelProgress`, `CartridgeShelf` en formulier-onderdelen (`Field`, `TextField`, `Check`, `SubmitButton`, `FormMessage`).

## Architectuur

Ik heb dezelfde aanpak gebruikt als bij de catalogus: een `Backend`-interface (`src/lib/backend`) met drie implementaties.

| Modus | Wanneer |
|---|---|
| **Supabase** | Als de Supabase-variabelen zijn ingesteld (productie). Alles per gebruiker gaat via RLS. |
| **Memory** | Alleen als `SAVESLOT_MEMORY_BACKEND=1` en Supabase níét is ingesteld (lokaal en e2e). Werkt nooit op Vercel-productie. |
| **None** | Geen van beide: je kunt de site bekijken, en de loginpagina zegt "Sign-in not connected". |

- Alle wijzigingen gaan via Server Actions met Zod-validatie. Die controleren telkens of je bent ingelogd en vragen daarna verse data op.
- De gebruikersdata wordt nooit gecachet. Op de gamepagina's staat het gebruikersdeel binnen een `<Suspense>`, zodat de catalogusinformatie statisch blijft.

## Tests

| Soort | Resultaat |
|---|---|
| Unit en component (Vitest) | **110 groen** (was 86) |
| E2E (Playwright, desktop en mobiel) | **60 groen** (was 42) |
| Lint, typecheck, Prettier, build | groen |

- **Nieuwe unit-tests:**
  - formulier-validatie: prijs "€ 12,50" wordt 1250 cent, datum, conditie, minimaal één van cart/doos/handleiding
  - `safeNext` met pogingen tot open redirect en header-injectie
  - CSV met escaping en formula-injectie
  - het groeperen van exemplaren per game
  - de memory-store: gebruiker B kan niets van A lezen, wijzigen of verwijderen, en score en favoriet staan los van elkaar
- **Nieuwe e2e-tests:**
  - `/collection` stuurt je naar login en daarna terug
  - validatie bij aanmelden
  - **de volledige route:** aanmelden → exemplaar toevoegen (EU, doos, Good, €12,50) → rating, play, favoriet, wishlist → herinnering → kast, completion 1/24, Playing-tab, tabel → CSV → cabinet op de homepage → bewerken tot CIB → verwijderen
  - uitloggen, een fout wachtwoord en opnieuw inloggen, waarna je data er nog is
  - twee gebruikers zien elkaars collectie niet
  - profiel opslaan en valideren
  - export zonder login geeft 401
  - axe op login, gamepagina met exemplaar, collectie (kast en tabel) en settings
- **Supabase:** alle nieuwe queries heb ik live tegen de echte database gecontroleerd (de joins en filters geven 200). Het eind-tot-eind-pad met een echte Supabase-gebruiker kon ik hier niet draaien, omdat deze sandbox supabase.co niet bereikt.

## Afwijkingen van het plan en waarom

1. **`partialPrefetching` staat uit.** Die experimentele instelling uit de Next-scaffold zorgde dat het scherm na het opslaan niet ververste. Zonder die instelling werkt het wel.
2. **Formulieren worden niet meer automatisch leeggemaakt na een fout.** React 19 reset formulieren na een action. Daardoor verdween bijvoorbeeld je e-mailadres na een fout wachtwoord. Ik heb een `useForm`-hook toegevoegd die dat voorkomt.
3. **Rating en favoriet zijn aparte acties.** Zo kan de ene de andere niet overschrijven als je snel achter elkaar klikt.
4. **Foto's van je eigen exemplaren schuiven door naar fase 7.** De opslagbucket en de RLS ervoor staan al klaar. Uploaden en tonen kon ik hier niet testen, en het hoort bij de uploadbeveiliging (EXIF strippen, maximaal 5 MB) uit fase 7.
5. **Bulk-acties op `/collection` schuiven door naar fase 4.** Daar zitten ze beter, samen met de wishlist.
6. **De standaardgebruikersnaam is `player_…`.** Zolang je geen weergavenaam hebt ingesteld, begroet de homepage je met "PLAYER 1".

## Wat jij moet instellen in Supabase (eenmalig)

Ga naar het Supabase-dashboard, project **Save-slot**, en dan naar **Authentication → URL Configuration**:

- **Site URL:** je productie-URL op Vercel, bijvoorbeeld `https://save-slot-….vercel.app`
- **Redirect URLs:**
  - `https://<jouw-vercel-domein>/auth/callback`
  - `https://*-merijn-biz.vercel.app/auth/callback` (voor previews)
  - `http://localhost:3000/auth/callback`

Zonder deze instellingen werken de bevestigingsmail en de magic link niet. Inloggen met een wachtwoord kan pas nadat je je e-mail hebt bevestigd (dat is de Supabase-standaard).

## BrickFigLy-check

Geen verwijzingen.

## Screenshots

`reports/phase-3/`: login, gamepagina met exemplaar, rating, play-status en herinnering, de collectie (kast, tabel en mobiel), de homepage met cabinet, en settings.
