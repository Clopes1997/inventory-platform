# Inventory platform — Autoflex foundation

Migration/cutover operators: read [Retirement Readiness](RETIREMENT.md) and the
[Quarkus lifecycle review](QUARKUS-LIFECYCLE.md). Automated validation never authorizes source archival.

Autoflex manages a product catalog, brands/manufacturers, geographic city metadata,
finished stock, raw materials and bills of materials. It calculates independent
per-product production feasibility and supports reviewed imports from Arquivel,
Product Manager, Product List and old Autoflex snapshots.

This is the inventory foundation in the parent consolidation plan. Legacy applications
remain in their original folders; subsequent implementation lives in this monorepo.
No source has been retired and no production data has been migrated. Read [MIGRATION.md](MIGRATION.md)
before pointing an installation at real source data.

## Features and architecture

- React/TypeScript/Vite frontend with existing Redux Toolkit feature modules.
- Quarkus/Java 17 API, Hibernate/Panache, Bean Validation, MySQL and Flyway.
- Catalog descriptions, category paths, availability and brand/city selection.
- Combined name/brand/city/price/availability filters and matching statistics.
- Finished stock with opening/adjustment history and optimistic edit versions.
- Products with stock cannot be archived; archived codes remain reserved.
- Decimal raw-material/BOM quantities, and restoration of removed recipe pairs.
- ADMIN/OPERATOR/VIEWER roles retained from the existing implementation. Imports
  and user administration require ADMIN; product/material writes allow OPERATOR/ADMIN.
- Previewable atomic import bundles, source identity maps and record fingerprints.

Feasibility assumes all raw stock is independently available to each product. It does
not reserve/consume stock or generate a globally achievable production plan. Summed
scenario values are not actual inventory or revenue. Dashboard stock values describe
finished products only. Cities are geographic metadata, not warehouses. Currency and
material units require source-owner confirmation before live consolidation.

## Prerequisites

Java 17+, Maven 3.9+, Node.js 22/npm, and either a new MySQL database or Docker for
Quarkus development services. Docker Compose is optional for the configured production
stack. Tests use isolated H2; CI additionally runs the HTTP contracts on MySQL.

**Use a new empty target database.** Migrations come from `db/consolidated`.
Historical `db/migration` files remain unchanged and are not the default migration
path. Never run Flyway repair or rewrite old checksums to force a legacy database
to accept the new baseline. Existing source data needs a reviewed export/import.

## Local development (PowerShell)

From the inventory-platform root, with Docker available for an isolated MySQL dev service:

```powershell
cd apps/api
$env:INVENTORY_BOOTSTRAP_ADMIN = 'true'
$env:INVENTORY_AUTH_USER = 'admin'
$env:INVENTORY_AUTH_PASSWORD = Read-Host 'Initial administrator password (12+ characters)'
mvn quarkus:dev
```

For an already-created **new target** MySQL database without Docker, additionally set
`QUARKUS_DATASOURCE_JDBC_URL`, `QUARKUS_DATASOURCE_USERNAME` and
`QUARKUS_DATASOURCE_PASSWORD` before the same command. Do not use a legacy source DB.

In another terminal, from the inventory-platform root:

```powershell
cd apps/web
npm ci
npm run dev
```

Open `http://localhost:3000`; `/api` proxies to the backend on port 8080.
There is no default production account. After first provisioning, set
`INVENTORY_BOOTSTRAP_ADMIN=false` and remove the bootstrap password from the runtime
environment. Bootstrap does not overwrite existing users.

Sessions are held in memory and expire after 30 minutes. Reloading the page requires
login again. Tokens use stable user IDs; deleted users are rejected and old username
tokens cannot be reused. Development/test signing keys never serve as production defaults.

## Verification and production build

Run from the inventory-platform root:

```powershell
node --test tools/normalize-import.test.mjs
cd apps/api
mvn test
mvn package
cd ../web
npm run test:run
npm run typecheck
npm run build
npm run preview
```

Preview serves the built frontend on port 3000 and proxies API requests to a separately
running backend on 8080. `mvn test` includes units, schema-preservation tests and the new
`*HttpTest` contracts. Older `*ResourceIT` suites are separately named legacy tests and
are not claimed as part of this command. There is no lint script; typecheck and tests
are the current frontend validation commands.

For an isolated, disposable H2 smoke-test server (never use this profile for real data):

```powershell
cd apps/api
mvn.cmd package '-DskipTests' '-Dquarkus.profile=e2e'
java '-Dquarkus.profile=e2e' -jar target/quarkus-app/quarkus-run.jar
```

Its explicit fixture account is `inventory` / `inventory-test-password`. With the
frontend development server running, browser checks can be run from `apps/web`:

```powershell
npm.cmd run e2e:run -- --spec cypress/e2e/consolidation.cy.js
```

## Production configuration

| Variable | Purpose |
|---|---|
| `INVENTORY_DB_URL` | JDBC URL for a new persistent target MySQL database |
| `INVENTORY_DB_USER` / `INVENTORY_DB_PASSWORD` | Database credentials; required in production |
| `INVENTORY_AUTH_SECRET` | Random signing secret containing at least 32 bytes; required |
| `INVENTORY_BOOTSTRAP_ADMIN` | Explicit first-account provisioning; default false |
| `INVENTORY_AUTH_USER` / `INVENTORY_AUTH_PASSWORD` | Initial account when provisioning; password at least 12 characters |
| `INVENTORY_CORS_ORIGINS` | Exact allowed frontend origins when using split-origin hosting |
| `INVENTORY_CORS_ENABLED` | Set true only for split-origin hosting; same-origin deployment defaults false |
| `MYSQL_ROOT_PASSWORD` | Required only for the included Compose MySQL service |

The JVM production command is `java -jar apps/api/target/quarkus-app/quarkus-run.jar`
after packaging with the production profile and supplying runtime configuration.
Do not run a package built with the E2E/H2 profile as a production artifact.

## Deployment

`compose.yaml` configures persistent MySQL, the Java backend and an Nginx-served React
build with same-origin `/api` proxy and SPA routing. Only the web port is published,
at `http://localhost:8088`. Supply secrets through environment variables or an ignored
`.env` file, then run from the inventory-platform root:

```powershell
$env:INVENTORY_DB_PASSWORD = Read-Host 'Database password'
$env:MYSQL_ROOT_PASSWORD = Read-Host 'Database root password'
$env:INVENTORY_AUTH_SECRET = Read-Host 'Random signing secret (32+ bytes)'
$env:INVENTORY_BOOTSTRAP_ADMIN = 'true'
$env:INVENTORY_AUTH_USER = 'admin'
$env:INVENTORY_AUTH_PASSWORD = Read-Host 'Initial administrator password (12+ characters)'
docker compose up --build -d
```

After provisioning, disable bootstrap/remove its password and recreate the backend
with `docker compose up -d backend`. Place the web listener behind your HTTPS ingress
for public deployment. Keep the MySQL volume and rehearse backups/restoration; do not
use `docker compose down -v` on a populated installation.

GitHub Actions runs Node normalization tests, frontend tests/typecheck/build, backend
tests, MySQL HTTP/migration contracts and container builds. This configures validation,
not automatic production publishing. GitHub Pages cannot host the backend. Vercel is
not required for this persistent Java/MySQL architecture.

## Migration and current limits

Follow [MIGRATION.md](MIGRATION.md) for source export formats, converter commands,
preview/apply, source mappings, reconciliation and rollback. No converter reads or
modifies source databases automatically. Users are not transferred by the inventory
bundle importer and must be reconciled separately before retiring old Autoflex.

Local Docker/MySQL verification depends on those tools being installed; configured CI
checks are not claimed as locally executed. Source installations, currency, units and
ambiguous historic timestamps remain owner decisions. Code reuse for archived products
is rejected rather than silently merging identities. Import is a one-time migration,
not ongoing synchronization. Retain old applications read-only until all plan gates pass.


Retirement scope and owner decisions (2026-09-26) are recorded in [RETIREMENT.md](RETIREMENT.md). Passing automated checks does not authorize deletion or archival of the source.
