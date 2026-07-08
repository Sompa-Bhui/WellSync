# WellSync

WellSync is a Next.js health coordination app for nutrition, hydration, sleep, weight, medications, appointments, reminders, records, care circle access, and emergency profile sharing.

## Tech Stack

- Next.js 16
- React 19
- Prisma 6
- SQLite for local development
- PostgreSQL for production

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See [`.env.example`](/C:/Users/Sompa%20Bhui/Desktop/WellSync/.env.example) for the required variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `APP_URL`
- `JWT_SECRET`

## Database Workflow

- SQLite remains the local development database.
- `npm run migrations:verify` creates an isolated temp SQLite file, precreates the empty database, runs `prisma migrate deploy`, then runs `prisma migrate status`.
- PostgreSQL is the intended production database.
- The checked-in SQLite migration history is kept for local verification.
- A separate PostgreSQL migration history should be established before production deployment.

## Commands

```bash
npm run migrations:verify
npm run test:auth
npm run lint
npx tsc --noEmit
npm run build
```

## Reminder Processor

`npm run reminders:process` runs the CLI reminder processor. It is idempotent and should be scheduled by cron or a worker in production. No production scheduler is configured in this repository.

## Production Notes

- Production requires a real `DATABASE_URL` and canonical public app URL.
- Emergency public links use `NEXT_PUBLIC_APP_URL` or `APP_URL`; `localhost` is only the local-development fallback.
- Demo seed data is development-only and should not be auto-run in production.
- Health is exposed at `/api/health`.
- File metadata-only records remain a known limitation of the current application model.
- The migration replay verifier is only for migration verification and not application runtime behavior.

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Security](./docs/SECURITY.md)
- [Deployment Runbook](./docs/DEPLOYMENT.md)
- [PostgreSQL Migration Plan](./docs/POSTGRESQL_MIGRATION.md)
- [Demo Guide](./docs/DEMO_GUIDE.md)
- [Screenshot Checklist](./docs/SCREENSHOTS.md)
- [Interview Guide](./docs/INTERVIEW_GUIDE.md)
- [Resume Bullets](./docs/RESUME_BULLETS.md)
