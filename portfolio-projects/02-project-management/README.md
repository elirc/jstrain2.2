# Orbit Projects

Orbit is an independently runnable multi-tenant project-management release candidate built with strict TypeScript, Node's SQLite driver, React, and SQL. It prioritizes tenant isolation, permission-aware project access, explicit conflicts, stable board ordering, atomic WIP limits, and observable background work.

## Quick start

Requires Node 22.5+ (tested on Node 22.16).

```bash
npm install
copy .env.example .env
npm run db:reset
npm run dev
```

Open `http://localhost:5202`. The API listens on `4202`; the worker shares the SQLite queue. For production-style local execution use `npm run build`, then `npm start` and `npm run start:worker` in separate terminals. `npm run check` is the full local quality gate.

Demo accounts use local bearer tokens, intentionally visible for demonstration only:

| Organization | User | Bearer token | Role |
| --- | --- | --- | --- |
| Acme Studio | owner@acme.test | `demo-owner-acme` | owner |
| Acme Studio | guest@demo.test | `demo-guest-acme` | guest, Website Launch only |
| Globex Labs | owner@globex.test | `demo-owner-globex` | owner |

Send `Authorization: Bearer <token>` and `X-Organization-Id: <org uuid>`. The latter selects among the authenticated user's memberships; it does not grant tenancy.

## Commands

| Outcome | Command |
| --- | --- |
| API/web/worker development | `npm run dev` |
| Migrate / deterministic seed / clean reset | `npm run migrate` / `npm run seed` / `npm run db:reset` |
| Types / lint / all tests | `npm run typecheck` / `npm run lint` / `npm test` |
| Unit / React / integration / concurrency / smoke | `npm run test:unit` / `npm run test:react` / `npm run test:integration` / `npm run test:concurrency` / `npm run test:e2e` |
| Production build | `npm run build` |
| API / worker | `npm start` / `npm run start:worker` |

## Implemented

- Organizations, users, active/suspended memberships, project grants, invitations, and owner/admin role checks.
- Tenant-safe projects, boards, columns, list/search/sort/bounded pagination, tasks, comments, saved views, immutable activity records, notification storage, and attachment metadata.
- Sparse floating-point task ranks, optimistic versions with current server state in conflicts, atomic WIP checks, move idempotency, stable ID tie-breaking.
- React organization switcher with generation-based stale-response rejection, list/board views, filtering, task details, keyboard (`Alt/Ctrl` + arrows) and button movement, conflict announcements, loading/empty/error states.
- Independently runnable worker with attachment scan simulation, HMAC-SHA256 webhook signing, dedupe constraints, bounded exponential retry, and dead letters.
- Correlation IDs, structured JSON logs, liveness/readiness endpoints, payload bounds, graceful API/worker shutdown, deterministic seeds, migration repeat test, authorization/concurrency/cache tests.

API examples and status/error contracts are in [docs/API.md](docs/API.md). Architecture, ERD, risks, authorization, and operations are under `docs/`.

## Honest limitations

This is a portfolio-scale SQLite release candidate, not a hosted collaboration service. Local demo bearer tokens are not production authentication; invitations are returned by the demo API instead of emailed. Attachment content is not persisted—metadata and scanning are deliberately simulated. Webhooks are signed and scheduled, but the default worker logs delivery instead of making outbound network calls. Notifications, labels, assignments, archive/restore, comment edits, project templates, exports, and ownership transfer have schema/domain foundations but not every mutation has a UI. Sparse ranks eventually require rebalancing. SQLite serializes writers and a multi-instance deployment requires PostgreSQL plus row/advisory locking. There is no real-time transport, malware engine, billing, or object store.

Scale assumption: up to 50 organizations, 100 active users per organization, 100k tasks per organization, and one API/worker host. The indexed task listing was designed around bounded pages; a real FTS index is the next threshold once `%LIKE%` search exceeds measured latency goals.

## Security note

Never expose demo tokens outside localhost. Production work must replace sessions with secure, rotated, HttpOnly cookies or standards-based OIDC, encrypt integration secrets, enforce HTTPS/CSRF policy, use a real secret manager and object store, and execute the PostgreSQL migration described in ADR-001.
