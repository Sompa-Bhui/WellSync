# Demo Guide

## 8-12 Minute Walkthrough

### 1. Login

- Click the login page and sign in with demo credentials.
- Explain that session cookies and active-profile context are established together.
- Do not claim SSO or MFA.

### 2. Dashboard

- Start on the overview dashboard.
- Explain the card-based aggregation of nutrition, hydration, sleep, weight, medications, appointments, and reminders.
- Point out that the dashboard is profile-scoped.

### 3. Family Profile Switching

- Open the profile switcher.
- Explain that each profile has separate data and permissions.
- Do not claim cross-account sync.

### 4. Nutrition, Hydration, Sleep, Weight, Activity

- Visit each module briefly.
- Explain that the app uses the same profile context across all health logs.
- Do not claim wearable or external device ingestion.

### 5. Medications

- Open the medications list and a medication detail page.
- Explain medication CRUD and event tracking.
- Highlight reminder linkage and deduplicated notification creation.

### 6. Appointments and Follow-Ups

- Open appointments and a detail view.
- Explain how follow-up tasks are derived from appointment workflows.
- Do not claim calendar sync.

### 7. Timeline

- Open the timeline view.
- Explain it as a cross-domain event stream for health activity.

### 8. Records Vault

- Open records.
- Explain the vault model and ownership checks.

### 9. Care Circle

- Open Care Circle pages.
- Explain invitation flow, member permissions, and revoked-access denial.

### 10. Handoff

- Open a handoff page.
- Explain shared-caregiver continuity and acknowledgement tracking.

### 11. Emergency QR / Public Page

- Open the emergency panel and public page link.
- Explain minimum disclosure and tokenized access.
- Do not claim this is a general public profile.

### 12. Reminders and Notifications

- Show reminders and notifications.
- Explain deterministic processing, deduplication, unread count, mark-read, and mark-all-read.

### 13. Security and Testing Highlights

- End with the auth regression tests and migration replay verifier.
- Explain that the repo includes request-level IDOR tests and isolated migration replay checks.
- Do not claim live PostgreSQL verification unless it has actually been completed.
