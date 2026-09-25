# Quarkus lifecycle review — 2026-09-25

## Decision

Keep the existing architecture, but track the runtime upgrade as high-priority technical debt.
The current community Quarkus pin is **3.8.4** in apps/api/pom.xml. The project's three
JJWT artifacts are independently pinned to 0.12.5; a Quarkus BOM update will not update them.

Community 3.8 reached end of life on 2025-02-28 (final patch 3.8.6.1). It no longer has
promised community security maintenance. This is a support finding, not a claim that every
published CVE is reachable in this application. See the official [EOL table](https://quarkus.io/eol/)
and [security policy](https://quarkus.io/security/).

Candidate: **Quarkus 3.33.3.3**, the current maintained 3.33 LTS patch found in the
[release notice](https://quarkus.io/blog/quarkus-3-33-3-3-released/). Recheck the current patch
before executing the upgrade. The [3.33 announcement](https://quarkus.io/blog/quarkus-3-33-released/)
documents its 12-month support policy.

## Why this is not a low-risk patch here

- The RESTEasy Reactive Jackson extension used by this POM was renamed to quarkus-rest-jackson
  in [3.9](https://github.com/quarkusio/quarkus/wiki/Migration-Guide-3.9). Review filter behavior
  and exact login exemptions after relocation, not just compilation.
- This app uses quarkus.hibernate-orm.database.generation; [3.23](https://github.com/quarkusio/quarkus/wiki/Migration-Guide-3.23)
  changes schema configuration naming. Clean Flyway lineage and disabled schema generation must remain enforced.
- The target crosses Hibernate ORM 7/Jakarta Persistence 3.2 in [3.24](https://github.com/quarkusio/quarkus/wiki/Migration-Guide-3.24),
  then later ORM updates. Recheck optimistic versions, archived entities, decimal serialization,
  native adjustment SQL, query semantics and actual MySQL migration/restore behavior.

A reasonable planning estimate is 2–4 engineering days plus integration review, not a promised
delivery duration. Updating configuration/dependencies is small; validating persisted-data and
authentication behavior dominates the risk. No language/framework replacement is warranted.

## Upgrade acceptance

Use a separate verification branch. Update BOM/plugin together, migrate renamed artifacts/config,
resolve independent JWT dependencies, then run every backend/frontend/browser test, production
image build and the disposable MySQL import/restart/restore rehearsal. Compare schema and exact
stock values before/after. Retain the known application image and database backup as rollback
pair; never roll old code over an incompatible database.

No upgraded runtime was executed in this milestone. Baseline 3.8.4 tests passed; this does not
certify a 3.33 upgrade. The upgrade is explicitly deferred rather than mixed into migration
reconciliation, and requires resolution or explicit risk review before production cutover.
