# Security

Selvedge is a shared handweaving studio. This is an honest assessment of what it protects and what it deliberately leaves open as a public demo.

## Authentication and sessions

- Passwords are hashed with scrypt (N=16384, r=8, p=1) and a per-password random salt; verification is timing-safe.
- Sessions are random 32-byte tokens. Only an HMAC-SHA256 hash of the token (keyed by `SESSION_PEPPER`) is stored, so a database leak does not yield usable session tokens.
- The session cookie is HttpOnly, SameSite=Lax, and Secure in production. These are opaque session tokens, **not JWTs**; there is no NextAuth and no client-readable credential.
- Sign-in and demo sign-in are rate-limitable entry points; the demo sign-in only issues sessions for the seeded demo accounts and only when `DEMO_MODE` is on.

## Authorization

- Roles (weaver, dyer, manager) are enforced server-side in the service layer and re-checked in server actions. Hiding a button is never the only guard.
- Every query is scoped to the caller's studio, so a member of one studio cannot read or mutate another studio's drafts, lots, projects or releases.

## Data integrity

- Yarn reservation is an atomic conditional decrement inside a transaction, with a database `CHECK (lengthOnHandM >= 0)` as the final backstop. Concurrent draws cannot overdraw a dye lot.
- Draft autosave is revision-checked optimistic concurrency; a stale write affects zero rows and is rejected.
- Releases are append-only. A release snapshot is checksummed with SHA-256 over canonical JSON (sorted keys) so the hash survives a jsonb round-trip; verification recomputes it and fails on tampering.
- String enums (roles, lifecycle states, reservation reasons) carry database CHECK constraints.

## Transport and headers

- Production responses set HSTS, X-Content-Type-Options, Referrer-Policy, X-Frame-Options DENY, COOP/CORP, a Permissions-Policy, and a Content-Security-Policy scoped to self-hosted assets.
- All runtime assets (fonts, scripts, styles) are same-origin; the drawdown engine makes no network call.

## Accepted residual risk (public demo)

- The demo studio is shared and seeded, and its password is published on the login page. Anyone can sign in as a demo role and mutate the demo data. This is intentional for a public demo and is reset by the seed.
- The demo is not a production multi-tenant service. Do not store real or sensitive data in it.

## Reporting

If you find a vulnerability that affects real deployments (not the intended demo openness), open a private advisory or contact the maintainer. Please do not file public issues for exploitable details.