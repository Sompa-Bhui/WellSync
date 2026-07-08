# Architecture

## High-Level System

```mermaid
flowchart LR
  Browser[Browser / Mobile Browser] --> Next[Next.js App Router]
  Next --> UI[Dashboard Pages]
  Next --> API[Route Handlers]
  API --> Auth[Auth + Session Cookies]
  API --> Access[Active Profile + Caregiver Authorization]
  API --> Prisma[Prisma Client]
  Prisma --> SQLite[(SQLite Local Dev)]
  Prisma --> PG[(PostgreSQL Production Target)]
  API --> Notify[In-App Notifications]
  API --> Reminders[CLI Reminder Processor]
  API --> Emergency[Public Emergency Token Flow]
  API --> Audit[Audit Logging]
```

## Authorization and Profile Access

```mermaid
flowchart TD
  Req[Authenticated Request] --> Session[Read session cookie]
  Session --> User[Resolve session user]
  User --> Active[Resolve active family profile]
  Active --> Shared{Shared caregiver?}
  Shared -->|owner| Owner[Owner access]
  Shared -->|member| Perms[Check permission scope]
  Perms --> Route[Allow or deny route action]
  Owner --> Route
```

## Reminder to Notification Flow

```mermaid
flowchart LR
  Source[Medication / Appointment / Hydration / Custom Reminder] --> Reminder[Reminder row]
  Reminder --> Processor[CLI reminder processor]
  Processor --> Dedup[Dedup key check]
  Dedup --> Notification[Notification row]
  Processor --> Next[nextTriggerAt / lastTriggeredAt update]
```

## Emergency Token Flow

```mermaid
flowchart LR
  Owner[Owner manages emergency profile] --> Token[Emergency token]
  Token --> Public[Public emergency route]
  Public --> Disclosure[Minimum disclosure fields]
  Public --> AccessLog[Access log entry]
```

## Actual Layers

- **Next.js application**: App Router pages and route handlers.
- **Frontend/dashboard layer**: profile-aware dashboard and domain pages.
- **API route layer**: CRUD and workflow endpoints.
- **Auth/session layer**: JWT session cookie plus active-profile cookie.
- **Shared caregiver authorization**: permission checks in `src/lib/authorization.ts`.
- **Prisma data layer**: one Prisma Client over SQLite locally and PostgreSQL in production.
- **Reminder processing service**: CLI script `npm run reminders:process`.
- **Notification system**: in-app notification rows and unread counts.
- **Public emergency flow**: token-based read-only disclosure page.
- **Audit logging**: server-side audit trail for sensitive actions.
- **Isolated auth test DB**: separate SQLite DB created for auth regression tests.
- **Migration replay verifier**: isolated SQLite replay with a precreated file for deterministic deploy/status checks.
