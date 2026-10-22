# Security Notes and Production-Readiness Checklist

**Status:** Pilot-stage (login, sessions, rate limits, MongoDB and Redis implemented; see the open items below). This document records important limitations visible in the current implementation; it is not a security audit.

## Before sharing or deploying

- [ ] Keep `.env` out of version control and distribution archives. Share `.env.example`, never credentials.
- [ ] Rotate any API key that has been committed, included in a ZIP, or exposed in a screenshot/log.
- [x] Shared-state endpoints require a valid login session (`WRITE_TOKEN` is an optional extra gate).
- [x] Authentication: mobile + password or OTP, admin password + OTP, scrypt hashes, hashed OTPs, lock-outs, session tokens in Redis. See [AUTH_AND_DATA.md](AUTH_AND_DATA.md).
- [ ] Server-enforced **role-based authorisation per record**: today any logged-in user can read the whole shared dataset, and admin-only tools (`/api/admin/*`) are the only role-checked routes.
- [x] Durable database: MongoDB (users, dataset, logs) and Redis (OTP, sessions, limits).
- [ ] Store records as separate collections with validation and concurrency control (the dataset is still one document with last-write-wins), and test backups.
- [ ] Validate and limit every request, uploaded file, CSV row, image, and user-supplied string on the server.
- [x] Rate limiting (OTP, login, AI endpoints), basic security headers, structured JSON logs. Bearer-token auth is not cookie-based, so CSRF does not apply.
- [ ] Restrict CORS to your domain and add a Content-Security-Policy.
- [ ] Review privacy, consent, retention, and deletion requirements before collecting real farmer or buyer information.
- [ ] Restrict and monitor browser-exposed third-party keys, especially the Sarvam widget configuration.
- [ ] Use HTTPS and a managed production host; do not expose the development server directly to the public internet.
- [ ] Review AI-generated crop advice with agricultural experts and make uncertainty/verification clear to users.
- [ ] Confirm third-party API terms, quotas, photo licenses, data attribution, and current government price data.
- [ ] Test backups, recovery, monitoring, accessibility, and failure behaviour before launch.

## Known limitations

- Without `MONGODB_URI` / `REDIS_URL` the server uses a local file and memory (development only): sessions and OTPs are lost on restart.
- The shared dataset is one document readable by every logged-in user; UI role separation is not server-side record access control.
- Session tokens are kept in the browser's local storage; an XSS bug would expose them. Keep dependencies and inputs under review.
- OTP delivery depends on your SMS provider and Indian DLT approvals; the `console` provider is for development only.
- Some provider configuration is delivered to the browser for widget use. Browser-visible values cannot be treated as secrets.
- Live mandi data depends on external providers, available records, source stability, and data quality. Verify important prices and MSP values independently.
- AI crop analysis can be wrong. It should not replace a qualified agronomist, KVK, or local agricultural advice, especially when crop loss or chemical use is at stake.
- Translation output may be machine-generated and should be reviewed by fluent speakers before use in high-stakes instructions.

## Incident response basics

If a credential is exposed, revoke or rotate it at the provider, update the local `.env`, restart the app, and inspect source control history and shared archives for additional copies. Removing a key from the latest file does not invalidate a key that was already exposed.
