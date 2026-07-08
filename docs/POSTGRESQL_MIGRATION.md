# PostgreSQL Migration Plan

WellSync currently uses SQLite for local development and Prisma migration verification. PostgreSQL is the intended production database, but live PostgreSQL verification is still pending in this repository.

## Why SQLite remains local development

- The current feature set, tests, and migration replay verifier are already stable on SQLite.
- SQLite makes local iteration fast and keeps the checked-in migration history reproducible on this workstation.
- The repository includes a controlled replay verifier that creates a fresh empty SQLite file before running Prisma deploy.

## Why SQLite migration SQL should not be blindly replayed on PostgreSQL

- SQLite and PostgreSQL differ in type handling, locking behavior, and certain migration semantics.
- A migration chain that is valid for SQLite can still require adjustment or a production baseline strategy before PostgreSQL cutover.
- This repository should treat the existing SQLite chain as authoritative for local development, not as a proof of PostgreSQL readiness.

## Transition Strategy

1. Keep the existing SQLite migration history unchanged for local development.
2. Create a separate PostgreSQL production baseline once a real PostgreSQL database is available.
3. Verify schema parity against the current Prisma schema before production cutover.
4. Regenerate Prisma Client after any datasource or migration change.
5. Validate `prisma migrate status` against the production database before promoting deployments.

## Production Baseline Strategy

- Start from the current Prisma schema as the source of truth.
- Establish a PostgreSQL database and a production migration history that does not overwrite the checked-in SQLite chain.
- Use a staging PostgreSQL database first.
- Compare the deployed schema to `prisma/schema.prisma`.
- If a baseline is needed, mark the initial production migration as already applied instead of replaying SQLite-specific behavior blindly.

## Isolated Staging Verification

Recommended staging flow once PostgreSQL is available:

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/wellsync_staging"
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate
```

Verify:

- Reminder and notification tables exist.
- `EmergencyContact.notes` exists.
- `Reminder.nextTriggerAt` and `Reminder.lastTriggeredAt` exist.
- Notification deduplication fields exist.
- Care Circle and emergency tables deploy successfully.

## Schema Parity Checks

Check parity between the deployed PostgreSQL schema and the Prisma schema:

- table names
- column names
- foreign keys
- unique constraints
- indexes
- cascade behavior

If the production schema diverges, resolve that before promoting traffic.

## Rollback Considerations

- Keep a database backup before the first production migration.
- Prefer forward-fix migrations when possible.
- If a production migration fails, restore from backup or roll forward with a corrective migration.
- Do not destroy the local SQLite migration chain during rollback work.

## Backup Requirements

- Take a pre-cutover backup of the production PostgreSQL database.
- Validate restore procedures before launch.
- Keep a copy of the current migration history and the deployed Prisma schema.

## Cutover Checklist

1. Provision PostgreSQL.
2. Set the production `DATABASE_URL`.
3. Set a canonical `APP_URL` or `NEXT_PUBLIC_APP_URL`.
4. Run `npx prisma migrate deploy` against staging.
5. Run `npx prisma migrate status`.
6. Run `npx prisma generate`.
7. Run application smoke checks.
8. Back up production.
9. Apply the production migration baseline.
10. Deploy the web app and reminder processor together.

## Exact Commands

Local verification:

```bash
npm run migrations:verify
```

Production-style checks once PostgreSQL exists:

```bash
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate
```

## Status

Live PostgreSQL verification remains pending.
