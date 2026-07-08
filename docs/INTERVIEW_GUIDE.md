# Interview Guide

## Why did you build WellSync?

To unify day-to-day family health coordination in one app: logs, reminders, appointments, records, caregiver access, and emergency disclosure.

## Why Next.js?

It gives the app router, route handlers, and a single codebase for the dashboard UI and API layer.

## Why Prisma?

It provides typed database access, migrations, and a clear schema for the multi-profile health model.

## Why SQLite locally?

SQLite keeps local development lightweight and makes the checked-in migration history reproducible without extra infrastructure.

## Why PostgreSQL for production?

PostgreSQL is the more appropriate production database for durability, concurrency, and deployment readiness.

## How does active profile isolation work?

The session stores a user identity and a separate active-profile cookie. Route handlers resolve the active profile first and scope queries to that profile.

## How do caregiver permissions work?

Shared caregivers are assigned role-based permission maps. Route handlers check permissions before allowing reads or mutations.

## How did you prevent IDOR?

Sensitive routes verify ownership or active shared access before querying or mutating records. The repo also includes regression tests for cross-profile denial.

## How does reminder deduplication work?

Each reminder notification uses a dedup key derived from the reminder ID and trigger timestamp so the processor does not create duplicates on retry.

## How does emergency token security work?

Emergency access is tokenized, only exposes allowed public fields, and records limited access metadata. Tokens can be rotated or revoked.

## How do migration replay tests work?

The verifier creates a fresh SQLite file in isolation, runs `prisma migrate deploy`, then checks migration status and key schema assertions.

## Biggest technical challenge?

Keeping multi-profile authorization, reminder processing, and migration reproducibility aligned without weakening local development.

## What would you improve with more time?

I would finish a real PostgreSQL staging deployment and wire the reminder processor to a production scheduler.

## How would you scale it?

Move production to PostgreSQL, run the reminder processor as a scheduled worker, and keep profile-scoped APIs and permission checks as the primary security boundary.

## What is not implemented?

No live PostgreSQL verification in this repo, no production cron, no push/SMS/email delivery, and no wearable sync.
