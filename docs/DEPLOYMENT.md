# Deployment Runbook

## Recommended Architecture

Primary deployment target:

- Next.js web application
- PostgreSQL database
- separate reminder processor job

This matches the current repo structure and avoids claiming infrastructure that is not configured here.

## Implemented Locally

- App routes and dashboard UI are implemented.
- Prisma data access is implemented.
- Reminder processing exists as a CLI script.
- Health endpoint exists at `/api/health`.
- Public emergency links use a canonical app URL helper with a local fallback.

## Pending Live Infrastructure

- Production PostgreSQL provisioning
- Cron or scheduled job wiring for reminders
- Platform-specific hosting setup

## Required Environment Variables

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL` or `APP_URL`

Optional local-only defaults can remain in `.env.example`, but production should use real values.

## Build and Start

```bash
npm run build
npm run start
```

The build script currently uses webpack mode for compatibility in this workspace.

## Prisma Workflow

```bash
npx prisma generate
npm run migrations:verify
```

Production migration step once PostgreSQL is available:

```bash
npx prisma migrate deploy
```

## Health Check

Use:

```bash
GET /api/health
```

Expected behavior:

- `200` with `{ ok: true, database: "up" }` when the app and database are reachable
- `503` when the database check fails

## Canonical Public URL

- Use `NEXT_PUBLIC_APP_URL` or `APP_URL` for public emergency URLs.
- Do not rely on `localhost` in production.
- Do not trust request headers for canonical public URL construction.

## Reminder Processor

Current invocation:

```bash
npm run reminders:process
```

Operational guidance:

- Run it from cron or a scheduled worker.
- Keep it single-purpose and idempotent.
- Do not claim a production scheduler exists in this repository.

## Rollback

1. Stop the web deployment.
2. Stop the reminder processor.
3. Restore the production database backup if required.
4. Redeploy the previous application revision.
5. Re-run migration status checks.

## Logs

- Review application logs for API failures.
- Review reminder processor output for processing errors.
- Avoid logging raw emergency tokens or invitation tokens.

## Failure Recovery

- Verify `DATABASE_URL` first.
- Verify Prisma migration status.
- Verify the database backup and restore path.
- Re-run `npm run migrations:verify` locally if needed.
