# Inventory Frontend

React 18 + Vite + Redux Toolkit + Axios. Connects to the Quarkus backend.

## Setup

```bash
npm install
```

## Run (development)

Start the backend on port 8080, then:

```bash
npm run dev
```

Frontend runs at http://localhost:3000. API calls to `/api/*` are proxied to http://localhost:8080.

## Build

```bash
npm run build
```

Output in `dist/`. Serve with any static host; point API base URL via env if needed.

## Tests

After `npm install`:

```bash
npm run test       # watch
npm run test:run   # single run
```

Unit tests: `productsSlice`, `ProductList`, `ProductionSuggestion`, `RawMaterialList`.

**E2E (Cypress):** With backend and frontend running, open Cypress with `npm run e2e` or run headless with `npm run e2e:run`. Spec: `cypress/e2e/production-suggestion.cy.js` (create product → raw material → add material → production suggestion).
