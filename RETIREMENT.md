# Retirement Readiness

Source → Backup → Isolated restore → Preflight → Migration → Reconciliation → Acceptance tests → Restore/rollback test → Human review → Cutover approval → Source archival

**Passing automated checks does not authorize deletion or archival of the source.**

## Report contract

All projects use version 1 of tools/migration/report.mjs with migration-report.json and migration-report.md outputs. Copies live in each independent monorepo without a cross-repository runtime dependency.

PASS requires evidence. FAIL means a proven failure. REQUIRES_REVIEW means an unresolved semantic decision. NOT_RUN means absent execution evidence. Every mandatory gate must pass against a real source before READY_FOR_OWNER_ACCEPTANCE. Synthetic fixtures never satisfy real_source. Owner acceptance and archival authorization are never inferred. Dirty code blocks readiness.

The snapshot command only fingerprints/parses JSON and records unexecuted gates. It is not an import or restore test:

~~~powershell
npm run migration:inspect -- --snapshot C:\Backups\export.json --application legacy-app --installation local-copy --kind real --out migration-runs\run-001
npm run migration:test
~~~

Use --kind synthetic for generated samples. Choose a new output directory for each run. Reports are never overwritten. Exit 1 indicates command/snapshot failure; 2 means inspection finished but readiness is incomplete.

Reports record source identity/hash, target commit/dirty state, timestamp, counts/totals, integrity, discrepancies, mapping policy, manual reviews, automated tests and restore/rollback evidence. Use safe identifiers and evidence labels, never credentials or raw record contents. Retain immutable raw exports separately in operator-controlled storage; do not commit real data or private reports.

## Operator boundaries

## Inventory disposable rehearsal

Docker Engine with Compose, Node 22 and the installed frontend dependencies/Cypress binary are required.
The runner creates uniquely named disposable MySQL volumes, builds the production images, imports
the fixture twice, compares observed target fields and exact stock values, runs browser acceptance,
restarts the backend, restores a SQL backup into a second empty MySQL service and switches back.
Only the runner's generated Compose project is removed. Source files are read and fingerprinted only.

~~~powershell
npm run web:install
npm --prefix apps/web exec -- cypress install
npm run migration:test
npm run migration:rehearse -- --snapshot tools/migration/fixtures/inventory-source.json --policy tools/migration/fixtures/inventory-policy.json --kind synthetic --out migration-runs/rehearsal-001
~~~

Exit 2 is expected for synthetic evidence with unresolved real-source/cutover gates. Exit 1 is
a failed execution. Reports are generated in the chosen output directory; the SQL backup stays
there too and contains test user hashes. Keep real-data runs private. CI uploads JSON/Markdown only.

Legacy raw exports additionally require --application and --installation. Policies explicitly name
currency, finishedStockUnit=count, materialUnits by legacy ID, and historyPolicy=opening-balance-only.
The fixture's BRL/kg policies apply only to synthetic records, never to unidentified real data.
No unit conversion or currency conversion occurs. Naive timestamps stop preflight; obtain the source
timezone and explicit per-record offset before creating a reviewed normalized copy. Keep the original
and mapping evidence together. Historical movements are not manufactured from opening balances.

The authenticated administrator GET /api/imports/snapshot exports current imported entities with stable
legacy/target IDs and exact decimal strings. It reads entity tables, not the stored source JSON.
Unexpected/missing mappings, reference differences, archive changes and stock totals fail reconciliation.
Full legacy application-version rollback remains a review gate: the automated rehearsal verifies
same-version disposable database rollback, not unknown production-version compatibility.

See QUARKUS-LIFECYCLE.md: the unsupported runtime is explicit pre-cutover technical debt.

Read source copies only. Use a separate disposable target and unique database name/credentials. Never run a new lineage against a legacy database. Hash snapshots before/after. Reconcile exclusions explicitly. Backup creation is not proof: restore into a second empty target and compare counts, exact totals, references and acceptance behavior.

Rollback freezes writes and restores the compatible database and application version before reopening access. Do not run old code against a new schema. Post-cutover writes require explicit reconciliation; rollback may require downtime and must not silently discard them. Personal rollback uses browser backup restore and revision/stale-tab checks.

Adapters must record currency, units, timestamp interpretation and identity decisions. Never guess timezones, round silently or fuzzy-merge. Missing real snapshots remain NOT_RUN. Generated fixtures are labeled synthetic and cannot establish legacy retirement readiness.
