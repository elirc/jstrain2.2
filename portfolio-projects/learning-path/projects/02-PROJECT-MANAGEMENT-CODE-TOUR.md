# Project-management code tour

## Product sentence

The system must let people collaborate interactively without crossing tenant/project boundaries, silently overwriting edits, or bypassing workflow limits.

## Pure domain rules

Open [`packages/domain/src/index.ts`](../../02-project-management/packages/domain/src/index.ts).

- `grants` maps roles to actions. It is only the coarse layer; guest project grants still require a resource lookup.
- `rankBetween` creates sparse ordering positions without renumbering every task on each move.
- `assertWip` distinguishes moving within a full column from adding another task to it.
- `retryDelay` is deterministic and capped, so workers can be tested without clocks or randomness.

Try `rankBetween(1024, 2048)` repeatedly. Floating-point gaps eventually become too small; the README correctly names rank rebalance as a future threshold.

## Contracts

[`packages/contracts/src/index.ts`](../../02-project-management/packages/contracts/src/index.ts) is an executable API contract. `TaskMove` combines optimistic version, target, optional anchor, and idempotency key. `AttachmentCreate` rejects path separators and bounds size/type. `ListQuery` bounds page size and allowlists sort modes.

## Repository walkthrough

[`Repository`](../../02-project-management/apps/api/src/repository.ts) deliberately concentrates tenant-safe SQL operations.

### `authenticate`

The token hash, selected organization, active membership, and expiry must all match. The resulting `Identity` is trusted server context.

### `authorize`

It checks coarse action permission, project membership in the same organization, and explicit guest grant. Failure does not reveal a private resource.

### `projects`, `board`, and `tasks`

Each query includes `org_id`. Guest queries add project membership. Ordering is deterministic with ID tie-breakers. Search values are parameters, while sort SQL comes from an allowlist.

### `createTask`

It verifies project/column relationship and WIP, starts an immediate transaction, allocates the next human task number, computes sparse rank, writes task/activity, and commits. Consider whether the WIP check should be repeated after acquiring the transaction; this is an excellent review discussion about current single-writer assumptions.

### `updateTask`

Only allowlisted fields become SQL assignments. The `WHERE` includes expected version. Zero changed rows produce `VERSION_CONFLICT` with current server state instead of last-write-wins.

### `moveTask`

This is the main concurrency lesson:

1. check durable duplicate result;
2. begin immediate transaction;
3. tenant-scope and authorize task;
4. compare version;
5. validate destination belongs to same project;
6. atomically enforce WIP;
7. calculate rank relative to validated anchors;
8. update task/version, append activity, save response under idempotency key;
9. commit or rollback.

### Collaboration and integrations

Comments append activity. Attachments store bounded metadata and enqueue scan jobs in one transaction. Saved views enforce personal/project visibility. Invitations store a token hash rather than raw token. Activity schedules webhook deliveries without performing network calls in the request.

## HTTP walkthrough

[`app.ts`](../../02-project-management/apps/api/src/app.ts) connects Zod parsing, authentication context, repository calls, status codes, correlation logs, and error envelopes. Search for every place `parse` or `safeParse` is used, then verify there is no route that calls a write repository with unchecked `req.body`.

## React and cache isolation

[`apps/web/src/api.ts`](../../02-project-management/apps/web/src/api.ts) namespaces requests by organization and rejects responses from an older generation. [`App.tsx`](../../02-project-management/apps/web/src/App.tsx) shares canonical board data between list/board views, preserves filter state, announces conflicts, and offers keyboard/button movement.

Read [`cache-isolation.test.tsx`](../../02-project-management/tests/cache-isolation.test.tsx): the response is intentionally delayed, organization changes, then the stale result is released. That is much stronger than asserting `clearCache()` was called.

## Worker walkthrough

[`worker.ts`](../../02-project-management/apps/worker/src/worker.ts) simulates attachment scanning and signs webhook bodies with HMAC-SHA256. Delivery attempts become delivered, retryable, or dead. Tests inject the transport and verify signature/state without calling a real service.

## Test map

| Risk | Proof |
| --- | --- |
| tenant and API denial | [`api.integration.test.ts`](../../02-project-management/tests/api.integration.test.ts) |
| WIP race/idempotency | [`concurrency.test.ts`](../../02-project-management/tests/concurrency.test.ts) |
| stale organization cache | [`cache-isolation.test.tsx`](../../02-project-management/tests/cache-isolation.test.tsx) |
| pointer/keyboard-visible UI | [`web.test.tsx`](../../02-project-management/tests/web.test.tsx) |
| scanning/signature/retry | [`worker.integration.test.ts`](../../02-project-management/tests/worker.integration.test.ts) |
| blank/repeat schema | [`migration.test.ts`](../../02-project-management/tests/migration.test.ts) |

## Debugging scenarios

1. A guest sees a project count they cannot open. Inspect list/search aggregation, not only detail authorization.
2. Two moves exceed WIP. Confirm the count and update share one write transaction.
3. A task jumps unpredictably. Inspect anchor validation, rank collisions, and ID tie-breaking.
4. Switching organizations flashes the prior board. Trace generation capture and response application.

## Mid-level teach-back

Explain why `org_id` predicates, role grants, project grants, and cache invalidation are separate defenses. Then defend sparse ranks versus integer positions.
