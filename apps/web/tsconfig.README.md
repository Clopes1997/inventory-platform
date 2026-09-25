# TypeScript configs

- **tsconfig.json** — App-wide config for `src/`: components, slices, store, API client, and types. Run `npm run typecheck` to type-check the app.
- **tsconfig.node.json** — Vite-only config for `vite.config.js` (build tool). Excludes `src/` and `node_modules` so it only applies to the Vite config file.
