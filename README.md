# Teamwear Store Builder

An internal tool for an eCommerce coordinator who builds BigCommerce club
stores for sporting clubs. Instead of hand-building hundreds of products,
size variants, and supplier SKUs, you select **garments**, configure a
**store**, and export a ready-to-upload BigCommerce CSV.

The app revolves around garments, not products — products and their SKUs
are always *generated from* garments, never typed by hand.

## Quick start (mock mode — zero setup)

Mock mode is the default. No Supabase project, no auth, no database.

```bash
npm install
npm run dev
```

Open the printed local URL and walk the whole flow: **Dashboard → Garment
Library → Blueprints → Store Builder → Preview → CSV download.** The app
starts pre-loaded with 2 demo clubs, 9 demo garments, and a "Cricket
Template" blueprint (see `src/lib/mockData.ts`). All data lives in an
in-memory store for the session — refreshing the page resets it back to
the seed data.

A "Mock mode" badge in the top nav confirms which mode you're in.

## Verify the SKU + CSV engine in ~5 seconds

No dev server, no browser required:

```bash
npm run test:sku
```

This script:

1. Asserts the six SKU examples from the spec produce the exact expected
   strings (fails loudly, exits non-zero on any mismatch).
2. Applies the "Cricket Template" blueprint to club `ETDC` and prints every
   generated parent + variant SKU.
3. Prints a sample BigCommerce CSV (first ~15 rows).

## How it's built

The core logic is a set of pure, dependency-free TypeScript modules under
`src/lib/` — no React, no Supabase, fully unit-testable on their own:

| Module | Responsibility |
| --- | --- |
| `sizeTemplates.ts` | Single source of truth for size label → size code (kids/adults/socks/OSFA). |
| `sku.ts` | Builds SKUs **only** from structured supplier codes: `{RANGE}-{STYLE}-0-{TEAM}-{COLOUR}-{SIZE}`. Never derives a SKU from a display name. |
| `blueprintEngine.ts` | Turns a blueprint into store-garment rows; clones a club's garment configuration onto a new club (SKUs always regenerate, never copy verbatim). |
| `productGenerator.ts` | Turns configured garments into parent products + variants. Both the Preview page and the CSV export call this exact function, so they can never drift apart. |
| `validation.ts` | Blocking errors (missing club code/range/style/colour, duplicate SKU) vs. non-blocking warnings (a garment with zero sizes selected). |
| `csvExport.ts` | Renders the BigCommerce import CSV from the same generated products Preview shows. |

`src/lib/dataStore.ts` + `src/hooks/*` are the data layer. Every hook
(`useClubs`, `useGarments`, `useBlueprints`, `useStoreProjects`,
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
  lib/                  Pure engines: sku, sizeTemplates, validation,
                         blueprintEngine, productGenerator, csvExport,
                         mockData, dataStore, config, supabaseClient
  hooks/                useClubs, useGarments, useBlueprints,
                         useStoreProjects, useStoreProject, useTheme
  components/
    ui/                 shadcn-style primitives (button, card, dialog, ...)
    layout/              Navbar, page layout
    garments/            Garment add/edit dialog
    blueprints/           Blueprint create/edit dialog
    store-builder/        Draggable garment card, add-garment dialog
  pages/                Dashboard, GarmentLibrary, Blueprints,
                         StoreBuilderNew, StoreBuilderConfigure, Preview
scripts/
  testSku.ts            npm run test:sku entry point
supabase/
  migrations/0001_init.sql   Schema + RLS + storage bucket
  seed.sql                    Demo data seed
```

## SKU structure

```
{RANGE}-{STYLE}-0-{TEAM}-{COLOUR}-{SIZE}
```

Parent products use the literal size segment `ALL`:

```
LINC-061-0-ETDC-MERDXX-ALL
```

Variants swap in the real size code:

```
LINC-061-0-ETDC-MERDXX-56
TEAM-327-0-ETDC-CRRDME-S
```

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS v4, shadcn-style
  components (Radix primitives + CVA), `@dnd-kit` for drag-and-drop reorder.
- **Backend (Phase 2):** Supabase — Auth, Postgres, Storage.
