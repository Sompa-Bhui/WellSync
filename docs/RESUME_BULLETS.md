# Resume Bullets

## Concise Bullets

- Built a Next.js and Prisma health coordination platform with profile-scoped dashboards, reminders, notifications, appointments, records, and caregiver workflows.
- Implemented request-level authorization and active-profile isolation to prevent cross-profile access across sensitive family health data.
- Added deterministic reminder processing with deduplicated notifications, migration replay verification, and isolated auth regression tests.

## Detailed Bullets

- Designed a multi-profile health data model in Prisma with active-profile scoping, shared caregiver permissions, audit logging, and emergency token-based disclosure.
- Implemented route-handler APIs for medications, appointments, follow-ups, reminders, notifications, records, and emergency access with ownership checks and IDOR protections.
- Added a CLI reminder processor that advances `nextTriggerAt`, records `lastTriggeredAt`, and prevents duplicate notifications through dedup keys.
- Created an isolated SQLite migration replay verifier that runs Prisma deploy/status on a fresh temp database to validate the checked-in migration chain.
- Hardened production configuration with explicit environment-variable contracts, a canonical public app URL, and a health endpoint.

## 30-Second Pitch

WellSync is a Next.js health coordination app for families that centralizes profiles, medication reminders, appointments, records, emergency access, and caregiver workflows. I built a Prisma-backed multi-profile architecture with active-profile isolation, permission-based shared caregiver access, deterministic reminder processing, and request-level IDOR regression tests.

## 90-Second Pitch

WellSync is a Next.js and Prisma health coordination platform designed to help families manage multiple care contexts in one place. The app supports profile-scoped dashboards for nutrition, hydration, sleep, weight, medications, appointments, records, reminders, and caregiver handoffs. I designed the data model around active profile isolation and shared caregiver permissions so every request resolves to a specific family context before reading or mutating data. I also added an emergency token flow with minimum disclosure, a CLI reminder processor with deduplication, and an isolated migration replay verifier that exercises Prisma deploy/status against a fresh SQLite database. The result is a production-minded codebase with strong authorization boundaries and reproducible database validation.
