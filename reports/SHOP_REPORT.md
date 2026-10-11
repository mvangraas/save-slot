# Rapport — Webshop, reparatieservice en beheer

## Toegevoegde functies

**Webshop** (`/shop`)

- Catalogus met categorieën, filters (categorie, staat, op voorraad), zoeken, sorteren en paginering.
- Productpagina met foto's, specificaties, voorraadstatus en "in winkelwagen".
- Winkelwagen (in de browser bewaard), afrekenen met adres + akkoord voorwaarden.
- Betalen via Mollie. De status wordt altijd bij Mollie zelf opgevraagd (webhook + bevestigingspagina).
  Bedrag, valuta en order-id worden gecontroleerd. Voorraad wordt pas bij betaling afgeboekt, één keer.
- Bevestigingspagina met ordernummer (SS-xxxxxx), opnieuw betalen bij mislukte betaling.

**Reparatieservice** (`/repairs`)

- Overzicht van reparaties en prijsindicaties (indicatie, nooit een offerte).
- Formulier: apparaat, merk/model/serienummer, probleem, beschrijving, max. 4 foto's (EXIF eruit),
  afleverwijze (afspraak, opsturen, langsbrengen), contactgegevens, privacy-akkoord.
- Uniek reparatienummer (RS-xxxxxx) en statuspagina met tijdlijn.
- Status opzoeken met nummer + e-mail (`/repairs/status`).
- Indicatieprijs en definitieve prijs zijn duidelijk gescheiden. Geen betaling voor reparaties.

**Beheer** (`/admin`, alleen voor ADMIN_EMAILS, ook server-side afgeschermd)

- Dashboard met setup-checklist, recente bestellingen, open reparaties, lage voorraad.
- Producten en categorieën aanmaken/bewerken/verwijderen, foto's, prijzen en voorraad.
- Bestellingen bekijken en status bijwerken.
- Reparaties: status + bericht voor klant, definitieve prijs, interne notities, foto's.
- Prijsindicaties en doorlooptijden per apparaat/probleem.

**Overig**: `/contact`, `/legal/[doc]`, navigatie met Shop/Repairs/Contact + winkelwagen-icoon,
sitemap en robots bijgewerkt.

## Bewust dicht

Afrekenen en reparatieaanvragen blijven gesloten tot bedrijfsgegevens, juridische teksten en de
Mollie-sleutel zijn ingevuld. Er staan geen verzonnen bedrijfsgegevens of juridische claims in de code.

## Databasewijzigingen

Migratie `20261013090000_shop_and_repairs.sql` — toegepast op Supabase-project Save Slot:
tabellen voor categorieën, producten, productfoto's, bestellingen, orderregels, reparatie-apparaten,
-problemen, -prijzen, -aanvragen, -gebeurtenissen en -notities; functie `mark_order_paid`;
RLS (publiek alleen lezen van catalogus); buckets `product-images` (publiek) en `repair-photos` (privé).

Kleine fix uit fase 6: media-type `box_front` → `boxart_front`.

## Tests

- `pnpm check` (lint, typecheck, unit tests, build): groen. Nieuw: `src/lib/shop/shop.test.ts`
  (nummers/tokens, totalen, indicaties, config-poorten, validatie, betaal-sync met nep-Mollie,
  migratie-pariteit).
- `pnpm test:e2e`: 102 geslaagd. Nieuw: `e2e/shop-repairs.spec.ts` — volledige flow
  (admin maakt product → klant zoekt, bestelt, betaalt via mock-Mollie → voorraad op → admin verzendt
  → reparatieaanvraag met foto → admin werkt bij → klant zoekt status op), niet-admins krijgen 404,
  toegankelijkheid (axe) en lege staten, webhook negeert valse id's. De a11y-sweep dekt de nieuwe pagina's.

## Nog te doen door eigenaar

Zie `docs/SHOP_SETUP.md`: `ADMIN_EMAILS`, bedrijfsgegevens (`SHOP_*`) na KvK-inschrijving,
juridische teksten, `MOLLIE_API_KEY`. E-mailnotificaties zitten er nog niet in.
