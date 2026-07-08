# API Reference

Only actual routes in the repository are listed here.

## Auth

### `POST /api/auth/register`

- Auth: no
- Purpose: create a new user and default self profile
- Important fields: `name`, `email`, `password`
- Response: created user and profile
- Errors: missing fields, short password, duplicate email

### `POST /api/auth/login`

- Auth: no
- Purpose: authenticate an existing user and set session cookies
- Important fields: `email`, `password`
- Response: user and active profile
- Errors: missing fields, invalid credentials

### `POST /api/auth/logout`

- Auth: yes
- Purpose: clear session and active-profile cookies
- Response: `{ success: true }`

### `GET /api/auth/me`

- Auth: yes
- Purpose: return current session user

## Family Profiles

### `GET /api/family`

- Auth: yes
- Purpose: list profiles owned by the current user

### `POST /api/family`

- Auth: yes
- Purpose: create a family profile
- Important fields: `name`, `relationship`, optional preferences
- Errors: missing required fields

### `GET /api/family/active`

- Auth: yes
- Purpose: return active profile context

## Dashboard

### `GET /api/dashboard/overview`

- Auth: yes
- Permission: `dashboard.summary.view`
- Purpose: aggregated dashboard data and alerts
- Behavior: returns nutrition, hydration, sleep, weight, medication, next appointment, timeline, unread notification count, and next reminder

## Nutrition

### `GET /api/meals`
### `POST /api/meals`
### `GET /api/meals/[id]`
### `PUT /api/meals/[id]`
### `DELETE /api/meals/[id]`
### `GET /api/meals/search`
### `GET /api/meals/recipes`

- Auth: yes
- Purpose: meal logging, lookup, and management
- Permissions vary by route; mutations are owner-scoped in practice

## Hydration

### `GET /api/water`
### `POST /api/water`

- Auth: yes
- Permission: `hydration.view` for read
- Purpose: water logging and hydration history

## Sleep

### `GET /api/sleep`
### `POST /api/sleep`

- Auth: yes
- Purpose: sleep logging and retrieval

## Weight

### `GET /api/weight`
### `POST /api/weight`

- Auth: yes
- Purpose: weight logging and retrieval

## Activity

### `GET /api/activity`
### `POST /api/activity`
### `GET /api/activity/[id]`
### `PUT /api/activity/[id]`
### `DELETE /api/activity/[id]`

- Auth: yes
- Purpose: activity logs

## Medications

### `GET /api/medications`
### `POST /api/medications`
### `GET /api/medications/[id]`
### `PUT /api/medications/[id]`
### `DELETE /api/medications/[id]`

- Auth: yes
- Permission: medication view/manage permissions as applicable
- Purpose: medication CRUD and reminder linkage

## Medication Events

### `GET /api/medications/[id]/events`
### `POST /api/medications/[id]/events`
### `PUT /api/medications/events/[eventId]`

- Auth: yes
- Purpose: medication dose event records and updates

## Appointments

### `GET /api/appointments`
### `POST /api/appointments`
### `GET /api/appointments/[id]`
### `PUT /api/appointments/[id]`
### `DELETE /api/appointments/[id]`

- Auth: yes
- Permission: appointment view/manage permissions as applicable
- Purpose: appointment CRUD

### `POST /api/appointments/[id]/follow-ups`

- Auth: yes
- Purpose: create follow-up tasks linked to appointments

## Follow-Ups

### `GET /api/appointments/[id]/follow-ups`
### `POST /api/appointments/[id]/follow-ups`

- Auth: yes
- Purpose: follow-up task lifecycle

## Timeline

### `GET /api/timeline`
### `POST /api/timeline/manual`

- Auth: yes
- Purpose: timeline retrieval and manual event creation

## Records

### `GET /api/records`
### `POST /api/records`
### `GET /api/records/[id]`
### `PUT /api/records/[id]`
### `DELETE /api/records/[id]`

- Auth: yes
- Purpose: medical record vault

## Care Circle

### `GET /api/care-circle`
### `POST /api/care-circle`
### `GET /api/care-circle/invitations/[token]`
### `POST /api/care-circle/invitations/[token]`
### `DELETE /api/care-circle/invitations/[token]`
### `GET /api/care-circle/members/[id]`
### `PUT /api/care-circle/members/[id]`
### `DELETE /api/care-circle/members/[id]`

- Auth: yes
- Purpose: invitation and shared-caregiver management

## Handoffs

### `GET /api/care-circle/handoffs`
### `POST /api/care-circle/handoffs`
### `GET /api/care-circle/handoffs/[id]`
### `PUT /api/care-circle/handoffs/[id]`

- Auth: yes
- Purpose: caregiver handoff workflow and acknowledgement

## Audit

### `GET /api/audit`

- Auth: yes
- Purpose: read audit logs with access restrictions

## Emergency

### `GET /api/emergency`
### `POST /api/emergency`
### `POST /api/emergency/token`
### `GET /api/emergency/public/[token]`
### `GET /api/emergency/contacts`
### `POST /api/emergency/contacts`
### `PUT /api/emergency/contacts/[id]`
### `DELETE /api/emergency/contacts/[id]`

- Auth: owner for management routes, public for token page
- Purpose: emergency profile management and minimum-disclosure public access

## Reminders

### `GET /api/reminders`
### `POST /api/reminders`
### `PUT /api/reminders`
### `GET /api/reminders/[id]`
### `PATCH /api/reminders/[id]`
### `DELETE /api/reminders/[id]`

- Auth: yes
- Permission: owner for reminder mutations
- Purpose: reminder CRUD and processor trigger

## Notifications

### `GET /api/notifications`
### `PATCH /api/notifications/[id]`
### `POST /api/notifications/read-all`

- Auth: yes
- Permission: dashboard summary view
- Purpose: unread count, single read, and read-all behavior

## Health

### `GET /api/health`

- Auth: no
- Purpose: lightweight app/database status
- Response: safe health status only
