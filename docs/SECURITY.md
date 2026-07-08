# Security

## Actual Protections

- Session authentication uses signed JWT cookies.
- Session cookies are `httpOnly`.
- Production cookies are marked `secure`.
- Cookies use `sameSite=lax`.
- Active-profile context is stored separately from the session cookie.
- Shared caregiver access is permission-based.
- Owner-only mutations are enforced on reminder and other sensitive write paths.
- Request-level IDOR protections exist across key entities.
- Invitation abuse is denied by ownership and active-member checks.
- Revoked caregiver access is denied by authorization resolution.
- Emergency public routes disclose only configured public fields.
- Emergency token rotation exists.
- Emergency access logs record limited metadata.
- Notification access is profile-scoped.
- Reminder source isolation is enforced with unique source keys.
- Reminder processing uses dedup keys to avoid duplicate notifications.
- Sensitive tokens are not intentionally logged.
- Auth regression tests cover cross-profile access control.

## Limitations

- No external security audit has been performed.
- No penetration test claim is made.
- No HIPAA compliance claim is made.
- Live PostgreSQL production verification remains pending.
- Production scheduler/cron is not configured in this repository.

## Production Notes

- Production must provide a real `JWT_SECRET`.
- Production must provide a canonical app URL through `NEXT_PUBLIC_APP_URL` or `APP_URL`.
- Public emergency links should not rely on localhost outside local development.

## Test Coverage

The repository includes isolated auth and reminder regression tests that verify:

- revoked caregiver denial
- cross-profile IDOR denial
- notification profile isolation
- reminder deduplication
- emergency minimum disclosure
