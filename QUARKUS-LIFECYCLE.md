# Quarkus lifecycle review — 2026-09-26

## Upgrade under verification

The isolated codex/quarkus-333-readiness branch upgrades BOM and build plugin together
from unsupported **3.8.4** to **3.33.3.3**, the maintained 3.33 LTS security patch described
in the official [release notice](https://quarkus.io/blog/quarkus-3-33-3-3-released/).
The [3.33 announcement](https://quarkus.io/blog/quarkus-3-33-released/) documents the LTS
maintenance policy. Community 3.8 is end-of-life; see the [EOL table](https://quarkus.io/eol/).
The prior decision to defer this upgrade is superseded by the owner's 2026-09-26 instruction.

## Compatibility changes

- Rename RESTEasy Reactive Jackson to quarkus-rest-jackson (3.9 migration).
- Replace hibernate-orm.database.generation with schema-management.strategy in all three
  configurations; keep none and the clean Flyway lineage, with clean-disabled=true.
- Replace http.cors with http.cors.enabled; keep explicit origins and production auth.
- Rename the relocated quarkus-junit5 test extension to quarkus-junit; move container
  validation to the entry type argument without weakening cascade validation.
- Hibernate ORM/Jakarta, Flyway, Netty and related managed dependencies follow the new BOM.
  No application redesign, schema migration, authentication exemption or data rewrite.
- Independent pins (JJWT 0.12.5, bcrypt 0.10.2, AssertJ 3.24.2) remain explicit; this BOM
  upgrade is not a claim that every independent dependency has received a new version.

References: [3.9 migration](https://github.com/quarkusio/quarkus/wiki/Migration-Guide-3.9),
[3.23 migration](https://github.com/quarkusio/quarkus/wiki/Migration-Guide-3.23),
[3.24 migration](https://github.com/quarkusio/quarkus/wiki/Migration-Guide-3.24).

## Verification

Local clean Maven test: 58 passed, zero failures/errors/skips on Java 21.
The first invocation overlapped the dependency edit and mixed old/new bootstrap classes;
a clean invocation with the final POM passed. That mixed invocation is not upgrade evidence.
H2 reports a Flyway tested-version warning; production MySQL validation remains mandatory.
Mockito emits the existing future-JDK dynamic-agent warning; Java 17/21 remain supported here.

Full branch CI (Java 17, frontend tests/typecheck/build, authentication/permissions,
migration/reconciliation, MySQL integration and retirement acceptance, browser workflows,
production Docker builds, restart/backup/restore/same-version routing) is pending.
Do not merge until all checks pass. Record the successful run in the final retirement report.

## Rollback boundary

The baseline main commit c797053 remains recoverable in Git. No legacy production data or
deployment existed, so historical cross-version rollback is N/A (owner decision).
The consolidated application's same-version restore/routing rehearsal remains mandatory.
For future production upgrades retain a compatible database backup and application image;
never run old code over an incompatible schema or silently discard post-snapshot writes.
