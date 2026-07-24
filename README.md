# Teamwear Store Builder

An internal tool for an eCommerce coordinator who builds BigCommerce club
stores for sporting clubs. Instead of hand-building hundreds of products,
size variants, and supplier SKUs, you select **garments**, configure a
**store**, and export a ready-to-upload BigCommerce CSV.

The app revolves around garments, not products — products and their SKUs
are always *generated from* garments, never typed by hand.

Garments are split into two layers, since every club is different:

- **Garment Library** — the catalogue-level facts that never change:
  Range Code, Style Code, category, and which size template/age brackets
  the style is cut in. These come from the supplier catalogue.
- **Store Builder** — colour and exact sizing, chosen per club when a
  garment is added to that club's store, since two clubs never want the
  same colourway or size run.

## Quick start (mock mode — zero setup)

Mock mode is the default. No Supabase project, no auth, no database.

```bash
npm install
npm run dev
```

Open the printed local URL and walk the whole flow: **Dashboard → Garment
Library → Store Builder → Preview → CSV download.** The app starts
pre-loaded with 2 demo clubs, 9 demo garments, and one fully-configured
demo store (see `src/lib/mockData.ts`). All data lives in an in-memory
store for the session — refreshing the page resets it back to the seed
data.

A "Mock mode" badge in the top nav confirms which mode you're in.

## Verify the SKU + CSV engine in ~5 seconds

No dev server, no browser required:

```bash
npm run test:sku
```

This script:

1. Asserts the six SKU examples from the spec produce the exact expected
   strings (fails loudly, exits non-zero on any mismatch).
2. Asserts the colour code engine builds a colour code (e.g. `MERDXX`)
   from colours picked off the fixed company colour table.
3. Builds the demo ETDC store (all 9 garments) and prints every generated
   parent + variant SKU.
4. Prints a sample BigCommerce CSV (first ~15 rows).

The brief-import engine (parsing + garment matching) has its own zero-setup
check:

```bash
npm run test:import
```

This asserts the parser correctly extracts product names/prices from
free-form text (skipping headers, greetings, blank lines) and that the
matcher matches real garments — even reworded or reordered — while
correctly flagging unrelated products as unmatched, then runs a sample
brief against the demo garment library and prints matched vs. flagged
lines.

## How it's built

The core logic is a set of pure, dependency-free TypeScript modules under
`src/lib/` — no React, no Supabase, fully unit-testable on their own:

| Module | Responsibility |
| --- | --- |
| `sizeTemplates.ts` | Single source of truth for size label → size code (kids/adults/socks/OSFA), plus the size-selection/grouping helpers Store Builder uses. |
| `sku.ts` | Builds SKUs **only** from structured supplier codes: `{RANGE}-{STYLE}-0-{TEAM}-{COLOUR}-{SIZE}`. Never derives a SKU from a display name. |
| `colourCode.ts` | Builds the COLOUR segment (e.g. `MERDXX`) from up to 3 named colours, each with a fixed 2-letter abbreviation (e.g. Marine → ME), padding unused slots with `XX`. Colours are picked from a fixed company table, never typed by hand. |
| `cloneEngine.ts` | Clones a club's garment configuration (garments, colours, sizes, prices) onto a new club. SKUs are never copied verbatim — colour_code is always derived fresh at generation time, so cloning "regenerates" automatically. |
| `productGenerator.ts` | Turns configured garments into parent products + variants — kids and adults sizing always become separate products, each with its own price. Both the Preview page and the CSV export call this exact function, so they can never drift apart. |
| `validation.ts` | Blocking errors (missing club code/range/style/colour/price, duplicate SKU) vs. non-blocking warnings (a garment with zero sizes selected). |
| `csvExport.ts` | Renders the BigCommerce import CSV from the same generated products Preview shows, prices included. |
| `briefParser.ts` | Parses free-form brief/email text into candidate product lines (name + price), skipping headers, greetings and blank lines. |
| `garmentMatcher.ts` | Matches parsed brief lines against the Garment Library by name (exact/substring/token-overlap scoring), only matching above a confidence threshold — anything else is left unmatched and flagged rather than guessed. |

`src/lib/dataStore.ts` + `src/hooks/*` are the data layer. Every hook
(`useClubs`, `useGarments`, `useColourNames`, `useStoreProjects`,
`useStoreProject`) branches on `MOCK_MODE`: reading/writing an in-memory
store when mock mode is on, or the real Supabase tables when it's off.
The UI never talks to either directly — it only calls these hooks, so
Phase 2 (Supabase) is a drop-in swap behind the same interface.

## Switching to Supabase (Phase 2)

1. Create a Supabase project.
2. Run the migration to create the schema, RLS policies, and a storage
   bucket for garment assets:

   ```bash
   supabase db push --db-url <your-connection-string>
   # or paste supabase/migrations/0001_init.sql into the SQL editor
   ```

3. Seed it with the same demo data used in mock mode:

   ```bash
   psql <your-connection-string> -f supabase/seed.sql
   # or paste supabase/seed.sql into the SQL editor
   ```

4. Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key:

   ```bash
   cp .env.example .env.local
   ```

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   Mock mode automatically switches off once both variables are set. To
   force it explicitly either way, set `VITE_MOCK_MODE=true` / `false`.

5. `npm run dev` — the app now reads and writes Supabase instead of the
   in-memory store, with no code changes required.

RLS policies in `0001_init.sql` grant any authenticated Supabase user full
read/write access — this is an internal single-tenant tool. Tighten the
policies if you need multi-tenant isolation later.

## Project structure

```
src/
  lib/                  Pure engines: sku, colourCode, sizeTemplates,
                         validation, cloneEngine, productGenerator,
                         csvExport, briefParser, garmentMatcher,
                         mockData, dataStore, config, supabaseClient
  hooks/                useClubs, useGarments, useColourNames,
                         useStoreProjects, useStoreProject, useTheme
  components/
    ui/                 shadcn-style primitives (button, card, dialog,
                         textarea, ...)
    layout/              Navbar, page layout
    garments/            Garment add/edit dialog, colour slot picker
    store-builder/        Garment checklist, draggable configured-garment
                           card (colour + per-size picker + price), add-garments
                           dialog, import-brief dialog
  pages/                Dashboard, GarmentLibrary,
                         StoreBuilderNew, StoreBuilderConfigure, Preview
scripts/
  testSku.ts             npm run test:sku entry point
  testImport.ts          npm run test:import entry point
supabase/
  migrations/0001_init.sql   Schema + RLS + storage bucket
  seed.sql                    Demo data seed
```

## Store Builder flow

1. **Create Club** — name, code, sport, supplier. The club code becomes
   the `{TEAM}` segment of every SKU.
2. **Garments** — tick which garments this club needs from the library
   (search + select all/clear), clone another club's garments/colours/
   sizes/prices wholesale, or **import a brief**: paste (or upload a
   `.txt` file of) an email/product brief, and it's matched against the
   garment library automatically — anything that doesn't match is flagged
   for review instead of guessed.
3. **Configure Store** — for each garment, set a custom product name,
   pick up to 3 colours, pick exactly which sizes this club needs
   (grouped Adults/Kids with quick "All"/"None", then editable
   size-by-size), and set a price per age-group product. Drag to reorder,
   duplicate, or remove.
4. **Preview & Export** — see every generated product/SKU exactly as it
   will be exported, with blocking-error and warning banners (including a
   missing-price error — a product can't export without one), then
   download the BigCommerce CSV.

### Importing a brief

The "Import Brief" button (Step 2) accepts pasted text or an uploaded
`.txt` file — direct PDF/Word parsing isn't supported yet, so a `.docx`
or `.pdf` needs to be pasted in as text first. Each line is parsed for a
product name and price, matched against the garment library by name
(tolerant of reordering and age/gender qualifiers like "(Adults)"), and
shown for review: matched lines are pre-checked with an editable price,
already-in-store matches are flagged and skipped, and unmatched lines are
flagged in amber so nothing is silently dropped. Only checked, priced
lines are added.

## SKU structure

```
{RANGE}-{STYLE}-0-{TEAM}-{COLOUR}-{SIZE}
```

Kids and adults sizing are always separate products (real pricing differs
per age group, and BigCommerce needs one product per price point). A
parent product's size segment is the age group it belongs to — `ADLT` or
`KIDS` — or `ALL` for garments that aren't split by age at all (socks,
headwear):

```
LINC-061-0-ETDC-MERDXX-ADLT
LINC-061-0-ETDC-MERDXX-KIDS
LINC-410-0-ETDC-MERDXX-ALL
```

Variants swap in the real size code:

```
LINC-061-0-ETDC-MERDXX-56
TEAM-327-0-ETDC-MNGOXX-S
```

The COLOUR segment (e.g. `MERDXX`) is never typed by hand — it's built
from up to 3 colours picked from a fixed company colour table (see
`src/lib/colourCode.ts`), each with its own 2-letter code (e.g. Marine →
`ME`), padded with `XX` for any unused slot.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, shadcn-style
  components (Radix primitives + CVA), `@dnd-kit` for drag-and-drop reorder.
- **Backend (Phase 2):** Supabase — Auth, Postgres, Storage.
