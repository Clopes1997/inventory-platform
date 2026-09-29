# Inventory platform

A product catalog and manufacturing workspace for finished stock, raw materials, bills of materials, production feasibility, brands and cities.

## Features and architecture

- React/TypeScript/Vite frontend with existing Redux Toolkit feature modules.
- Quarkus/Java 17 API, Hibernate/Panache, Bean Validation, MySQL and Flyway.
- Catalog descriptions, category paths, availability and brand/city selection.
- Combined name/brand/city/price/availability filters and matching statistics.
- Finished stock with opening/adjustment history and optimistic edit versions.
- Products with stock cannot be archived; archived codes remain reserved.
- Decimal raw-material/BOM quantities, and restoration of removed recipe pairs.
- ADMIN/OPERATOR/VIEWER roles. User administration requires ADMIN; product/material writes allow OPERATOR/ADMIN.

Feasibility assumes all raw stock is independently available to each product. It does
not reserve/consume stock or generate a globally achievable production plan. Summed
scenario values are not actual inventory or revenue. Dashboard stock values describe
finished products only. Cities are geographic metadata, not warehouses. Use consistent currency and material units throughout the catalog.

## Prerequisites

Java 17+, Maven 3.9+, Node.js 22/npm, and either a new MySQL database or Docker for
Quarkus development services. Docker Compose is optional for the configured production
stack. Tests use isolated H2; CI additionally runs the HTTP contracts on MySQL.

**Use a new empty target database.** Migrations come from `db/consolidated`.
Historical `db/migration` files remain unchanged and are not the default migration
path. Never run Flyway repair or rewrite old checksums to force a legacy database
to accept the new baseline.

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

On an empty database started through `mvn quarkus:dev`, the development profile creates a disposable administrator account:

```text
username: test
password: test
```

It also creates two sample products, two materials, recipes/BOMs, and finished-product stock so the catalog, inventory, and production-feasibility screens are usable immediately. The account is created only when missing; the sample catalog is created only when both catalog tables are empty, so it is never mixed into an existing development catalog. This seed is disabled outside the `dev` profile. Set `INVENTORY_DEMO_SEED_ENABLED=false` to suppress it locally.

Sessions are held in memory and expire after 30 minutes. Reloading the page requires
login again. Tokens use stable user IDs; deleted users are rejected and old username
tokens cannot be reused. Development/test signing keys never serve as production defaults.

## Verification and production build

Run from the inventory-platform root:

```powershell
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

GitHub Actions runs frontend tests/typecheck/build, backend
tests, MySQL HTTP/migration contracts and container builds. This configures validation,
not automatic production publishing. GitHub Pages cannot host the backend. Vercel is
not required for this persistent Java/MySQL architecture.

## Public demo (GitHub Pages)

Demo URL after activation: [Inventory Platform](https://clopes1997.github.io/inventory-platform/). Pages was disabled when checked on 2026-09-29; this URL is not yet verified live.

Deploy from `main` using GitHub Actions. No separate demo branch or duplicated application is needed. The existing React UI uses a read-only local Axios adapter only in Vite demo mode; normal development and production builds retain the real API.

From the repository root:

```sh
npm --prefix apps/web ci
npm --prefix apps/web run build:demo
npm --prefix apps/web run preview
```

Use `npm --prefix apps/web run dev:demo` for local demo development and `npm --prefix apps/web run test:demo` for adapter contract checks. Output: `apps/web/dist`. No demo secrets or environment variables are required. The build command selects `--mode demo`; never put backend credentials in Vite variables.

Activation: commit and push these changes to main, choose **Settings → Pages → Source → GitHub Actions**, then run the Deploy public demo workflow on main. Subsequent main pushes deploy automatically; pull requests only verify. Confirm the successful deployment URL before marking the project Preview on the portfolio.

Maintenance: Read-only fictional fixtures; writes and real integrations require the existing backend. Keep fixtures aligned with API response types when screens change. Unsupported requests fail locally instead of falling through to a server. Demo fixture code is omitted from normal production bundles. The existing container deployment remains the full-app production path. Demo-only hash routing supports direct links and reloads on Pages; the normal BrowserRouter remains unchanged. Relative demo assets work under the repository subpath.
