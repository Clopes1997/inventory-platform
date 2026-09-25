# Inventory migration runbook

Use a new, empty target database. Never run the target against legacy Flyway history,
repair checksums, or run the historical V4 seed. Back up each source installation
with its database's consistent-snapshot tooling, including soft-deleted rows. Retain
checksums, schema history, currency/units/timezone assumptions and raw exports securely.

## Prepare a reviewed interchange file

Export complete arrays from a database snapshot, not from a first-page UI:

- Arquivel/Product Manager: `{ "marcas": [...], "cidades": [...], "produtos": [...] }`,
  using original database fields (`nome`, `fabricante`, `valor`, `estoque`, `marca_id`, `cidade_id`).
- Product List: an array of products or `{ "products": [...] }`, with
  `id`, `name`, `description`, `price`, `quantity`, `categoryPath`, `available`.
- Autoflex: `{ "products": [...], "materials": [...], "recipes": [...] }`, including
  database IDs, codes, numeric values, foreign IDs and `deleted_at`.

Prefer decimal values and large IDs as JSON strings. Exporting through floating-point
tools can lose precision before this converter sees the data. Currency is not converted.
Naive deleted timestamps must first be annotated with the source's verified timezone.
Preserve the original snapshot separately; this converter does not transfer arbitrary
source columns or user accounts. It initializes legacy Autoflex finished stock to zero,
because that source did not record finished stock.

From the Autoflex root, with Node.js installed:

```powershell
node --test tools/normalize-import.test.mjs
node tools/normalize-import.mjs product-manager warehouse-a source-export.json reviewed-bundle.json
```

The output is created exclusively: an existing output file is never overwritten.
Keep the installation identifier stable across retries. Different installations with
the same numeric IDs remain distinct. Code-less products receive source-qualified
codes. Existing explicit code conflicts require a reviewed mapping; names never merge.
Fractional finished stock and excess monetary precision are rejected instead of rounded.

## Preview and apply

Log in as ADMIN and open **Import inventory**. Choose the reviewed bundle. Preview
reports new/already-imported records and errors without writing. Apply imports all
records in one transaction. The server also validates the bundle at apply time.
Repeating identical entries skips them; changed entries with an already-imported
source identity are rejected. Import is not a synchronization or overwrite mechanism.

Maximum 2,000 records per bundle. For larger sources, split into ordered bundles:
brands/cities first, products/materials next, recipes last. Each bundle is atomic;
the complete multi-bundle migration requires a write freeze and reconciliation before
opening the target to operators. Preserve every original export and import response.

The `import_record` table retains source/installation/entity/ID mappings, normalized
source JSON, SHA-256 record fingerprint and import time. Opening finished balances are
recorded explicitly; historical movements are not fabricated. Legacy deleted records
remain deleted. Users and their credentials must be reconciled separately before an
old Autoflex installation can be retired.

## Acceptance and rollback

Compare all source and target counts, mapping coverage, brands/cities/BOM references,
exact price/quantity totals and deleted/availability states. Do not treat a successful
HTTP response as complete reconciliation. Rehearse restoring the source and target
backups. Real MySQL, concurrent imports and browser acceptance remain deployment gates.
No production data has been imported by the implementation work.

Freeze old writes for final exports. Keep old deployments read-only until accepted.
After new target writes occur, rolling back requires retaining/reconciling those new
writes; merely restoring the old backup would lose them. Never automatically archive
source repositories as part of an import.
