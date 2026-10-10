# Fase 5 — Achievements en polish

## Wat is er gebouwd

**Achievements (31 stuks)**

- Definities in `src/lib/achievements/definitions.ts`. Ze zijn in te delen in zeven groepen:
  - collectiegrootte
  - staat (CIB, sealed, aankoopprijzen)
  - platform (GB, GBC, GBC-only, dual-mode, 1989)
  - regio's (JP, US, World Tour, regionale variant, Time Capsule)
  - genres en series (inclusief SGB en rumble)
  - spelen (completed, playing)
  - herinneringen, ratings, favorieten en wishlist (inclusief Wish Granted)
- **Server-side evaluatie:**
  - Na elke opslag-actie (collectie, game, wishlist) roept `saveProgress()` de evaluatie aan.
  - In Supabase doet `public.fn_evaluate_achievements()` dat. Deze functie gebruikt alleen `auth.uid()` en schrijft nieuwe unlocks weg.
  - Gebruikers kunnen `user_achievements` nooit zelf schrijven.
- **Wish Granted:** een trigger op `wishlist_items` legt de gebeurtenis vast in `private.achievement_events` wanneer je een wens weghaalt terwijl je de game bezit. Bij het verwijderen van een account (cascade) slaat de trigger dit over.
- **Stickervel (`/achievements`):**
  - Behaalde stickers zijn in kleur, met datum.
  - De rest is grijs met `???` en een hint.
  - Bovenaan staat een voortgangsbalk.
  - Werkt ook uitgelogd, met een "Sign in"-oproep.
  - Bij een bezoek worden eerder verdiende achievements meteen ingehaald. Dat is handig voor bestaande collecties.
- **Unlock-toast:**
  - "ACHIEVEMENT UNLOCKED" in LCD-stijl, maximaal drie tegelijk, met een link naar het stickervel.
  - `aria-live`, dus screenreaders lezen hem voor.
  - Hij verdwijnt na 6 seconden.
- **Home:** nieuwe sectie "Recent achievements" (de laatste 4).
- **Navigatie:**
  - In de desktopheader staat "Stickers", vanaf brede schermen. Zo blijft de header op 1024px netjes.
  - Daaronder bereik je het stickervel via home en via `/stats`.

**Polish**

- **Geluid** (optioneel, standaard uit):
  - Een schakelaar "Sound effects" in de footer; de keuze wordt onthouden.
  - 8-bit blips worden met Web Audio gegenereerd, dus er zitten geen audiobestanden in.
  - Een tikje bij het opslaan en een jingle bij een unlock.
- **Micro-interacties:**
  - een sticker-"pop" bij nieuwe stickers
  - een toast die in stapjes inschuift
  - pixel-hoeken op stickers
- Alles respecteert `prefers-reduced-motion` en de instelling "Reduce effects".
- **Cartridge-labels:** de lettergrootte past zich nu aan het langste woord aan (container queries). "Shantae" en "Pokémon" breken niet meer midden in een woord.
- **Foutschermen:**
  - 404 toont GAME OVER · ERROR 404, met "▶ Yes" en "Browse games".
  - 500 toont ERROR 500 met een foutcode.
  - Nieuw is `global-error.tsx`: een noodscherm voor als de hele app crasht.
- Er is eigen pixel-art voor 20 iconen (8×8, zelf getekend, geen bestaande artwork).

## Supabase (project Save-slot `stvjldcxadrbcnodvhop`)

- Migratie `20261011090000_achievements.sql` is toegepast. Die bevat:
  - 31 rijen in `achievements`
  - de tabel `private.achievement_events` + de trigger
  - `fn_evaluate_achievements()`
- **Live getest** met een tijdelijke testgebruiker in een transactie die daarna is teruggedraaid, dus er bleef niets achter:
  - De eerste aanroep gaf 13 juiste unlocks.
  - De tweede aanroep gaf niets terug, zoals bedoeld.
- Advisors:
  - De melding "security definer executable by authenticated" is **bewust**: de functie moet aanroepbaar zijn en werkt alleen op je eigen data.
  - Te doen in het Supabase-dashboard (fase 7): **Leaked password protection** aanzetten.
- Niet live getest: de Wish Granted-trigger in Supabase. Er was geen veilige manier om een DELETE te testen via de tool. De logica is identiek aan de memory-backend, die wel e2e getest is.

## Tests

- `pnpm check`: lint, typecheck, **127 unit-tests** en de build zijn groen. Nieuw:
  - alle regels van de evaluator
  - een pariteitstest die controleert dat de TS-definities en de SQL-migratie (rijen + regels) gelijk zijn
  - de cookie-parser
- `pnpm test:e2e`: **76 e2e-tests** groen (desktop + mobiel). Nieuw:
  - de complete flow uit §12: signup → zoeken → toevoegen → completion stijgt → wishlist → GOT IT → toasts "Insert Cartridge" en "Wish Granted" → stickervel (+ axe)
  - het stickervel uitgelogd
  - de 404 als GAME OVER
  - de geluidsschakelaar

## Afwijkingen en keuzes

- De regels staan twee keer: in SQL voor Supabase en in TypeScript voor de lokale memory-backend en de unit-tests. De pariteitstest bewaakt dat codes en namen gelijk blijven.
- Een nieuwe unlock wordt via een kortlevende cookie (`ss_unlocked`, 2 minuten, alleen codes) aan de toast doorgegeven. Zo werkt het voor alle formulieren, ook die zonder eigen state.
- De geluidsvoorkeur staat in de browser (localStorage), niet in het profiel (`sounds_enabled`). Synchroniseren tussen apparaten kan in fase 7.
- Bekend: op de 404-pagina blijft rechtsboven het spelerslot op "laden" staan.

## BrickFigLy-check

- Er is niets van BrickFigLy gebruikt of aangeraakt. Alle wijzigingen zijn alleen op `stvjldcxadrbcnodvhop` en in deze repo gedaan.

## Screenshots

`reports/phase-5/`:

- `achievements.png`
- `achievements-light.png`
- `achievements-m.png`
- `toast.png`
- `home.png`
- `wishlist-labels.png`
- `labels-m.png`
- `404.png`
- `header-1024.png`

## Volgende fase

Fase 6: echte data-providers (achter feature flags), RSS-nieuws met een cron-job en bronvermeldingen op `/about`.
