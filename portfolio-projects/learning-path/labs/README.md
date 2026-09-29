# Hands-on labs

Each lab is a bounded mid-level ticket. Work in a branch. Do not modify all three projects at once. Before coding, write the contract, riskiest assumption, non-goals, and first failing test.

## Lab workflow

1. Read the named source and tests.
2. Write a one-page change plan.
3. Predict one likely regression.
4. Add the smallest critical failing test.
5. Implement a vertical slice.
6. Run focused tests, then the project’s full gate.
7. Review the diff for validation, authorization, concurrency, failure behavior, logs, and documentation.
8. Complete a five-minute teach-back without source open.

## Lab 1: Inventory cycle count

### Outcome

An administrator can start a count, record a counted quantity, inspect variance, and approve an adjustment. Variance above a configurable threshold requires a second authorized approval.

### Constraints

- A count snapshots expected quantity/version.
- Approval is a named command, not arbitrary state update.
- Approval creates a compensating immutable movement and audit record.
- A stale count conflicts; it cannot overwrite intervening stock activity.
- Duplicate approval is idempotent.

### Proof

- domain transition table;
- real SQL rollback test;
- stale-version and cross-tenant denial tests;
- React form with validation/conflict state;
- migration blank/repeat test.

### Non-goals

Barcode hardware and recurring count scheduling.

## Lab 2: Inventory idempotency input hash

### Outcome

Reusing a key with the same normalized command returns the original result; reusing it with different input returns `IDEMPOTENCY_CONFLICT`.

### Design work

Choose canonical JSON or explicit field hashing. Document normalization, scope, retention, and migration compatibility. Write the concurrent duplicate test before changing `idem`.

## Lab 3: Project label assignment

### Outcome

A contributor can add/remove project labels on a task through React and API.

### Constraints

- Label and task must belong to the same project/organization.
- Guest must have project grant.
- Repeated add/remove is idempotent.
- Activity metadata contains safe IDs/names, not private before-values.
- Filtered list/board uses the same canonical data.

### Proof

Cross-project and cross-tenant denial, API integration, React behavior, stable filtered pagination, full build.

## Lab 4: Project rank rebalance

### Outcome

When adjacent sparse ranks become too close, the command safely rebalances one column while preserving visible order.

### Constraints

- Rebalance and move are one transaction.
- Version behavior is explicit.
- Only the target tenant/column changes.
- Concurrent move tests remain deterministic.
- Write a short measurement comparing row writes before/after.

### Design comparison

Compare floating ranks, fixed-width lexical ranks, integer renumbering, and separate linked-list edges. Choose from actual workload assumptions.

## Lab 5: Scheduling exceptions

### Outcome

Closures/absences remove slots; added hours add slots. Exceptions apply in the location’s IANA zone and remain bounded.

### Constraints

- Define precedence when closure and added hours overlap.
- Reject DST gaps and disambiguate repeated times.
- Staff, resource, and location scope remain tenant-safe.
- Existing confirmed appointments are not silently cancelled.

### Proof

Decision-table unit tests, property examples for interval subtraction/union, repository tenant tests, API search, React empty/result state.

## Lab 6: Wait-list offers

### Outcome

When a slot opens, a worker offers it to the next eligible candidate. The offer expires, promotes the next candidate, and can be accepted by at most one customer.

### Constraints

- Deterministic ordering and dedupe key.
- Offer is not a confirmed appointment.
- Acceptance performs the ordinary allocation conflict check.
- Expiration racing acceptance yields one explicit outcome.
- Notification retries do not duplicate offers.

### Proof

Fake-clock worker tests, forced race test, authorization, dead-letter/replay, customer conflict/expired UI.

## Lab 7: Cross-project operational drill

Choose one project and simulate a full incident:

1. inject a controlled dependency/database failure;
2. detect it through readiness/log/job state;
3. stop unsafe writes;
4. back up data;
5. deploy or configure a mitigation;
6. verify recovery;
7. write timeline, root cause, contributing factors, and prevention;
8. update a runbook and regression test.

Do not invent evidence. Include exact commands and sanitized output.

## Lab 8: Compatible PostgreSQL plan

Do not migrate everything. Pick the central invariant and write a concrete compatibility plan:

- transaction/locking SQL;
- isolation level;
- constraint equivalent;
- dual-version application window;
- data copy/checksum;
- rollback boundary;
- load and race tests;
- change to backup/restore.

Then implement only a repository contract test harness that can target SQLite or PostgreSQL. Document what remains unproved.

## Full verification

Inventory:

```powershell
npm run verify
npm run db:reset
npm start
npm run start:worker
```

Project management and scheduling:

```powershell
npm run check
npm run db:reset
npm start
npm run start:worker
```

Also run the focused test you added and show that it fails when the new guard is temporarily removed.
