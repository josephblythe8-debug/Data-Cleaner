# ClubHub SKU Generator

Standalone Vite + React version of the SKU generator artifact. Same logic and CSV output as the Claude artifact — colours, sizes, custom colour auto-coding, product upload CSV export — just running as a normal local web app instead of inside Claude.

## Run it

```
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build for deployment

```
npm run build
```

Outputs static files to `dist/` — deployable anywhere that serves static HTML (Netlify, Vercel, GitHub Pages, or just your own server).

## Notes on this port

- Persistence uses `localStorage` instead of the Claude artifact's `window.storage` API — data is saved per-browser, not shared across devices.
- Everything else (SKU format, colour code table, size categories, CSV structure) is unchanged from the Claude version.

## Opening in Claude Code

Point Claude Code at this folder and it has the full project context already — `package.json`, `src/App.jsx` (the actual generator logic), and this README. Good next steps to ask it for:

- Wiring this up to the BigCommerce Admin API directly (skip the CSV export/import step entirely)
- Adding a persistent colour code library so custom colours don't need re-entering per club
- Splitting `App.jsx` into smaller components as it grows
- Adding real backend storage (so the product list isn't stuck in one browser's localStorage)
