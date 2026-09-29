# 15 — Capstones and integration

## Outcome

Turn incomplete requirements into a coherent multi-file system, stage work,
control scope, and defend cross-layer decisions.

## The 80/20 model

Integration exposes disagreements hidden by isolated exercises: types versus
runtime validation, UI optimism versus database truth, service results versus
HTTP errors, transaction boundaries versus external effects, and tests versus
the actual requirement.

A capstone should grow through vertical slices. Each slice produces user-visible
or operator-visible behavior across the minimum necessary layers. Horizontal
weeks of “all database, then all API, then all UI” delay feedback and create
untested assumptions.

Stage complexity: establish one end-to-end path, add failures/boundaries, then
add concurrency/security/operations. Keep decisions and non-goals visible.

## Common traps

- One giant commit after days of work.
- Designing every future extension before first behavior.
- Tests and code based on the same misunderstood requirement.
- A “full-stack” project with mocked database or no deployment.
- Polished UI hiding missing error/security paths.
- New features added instead of finishing reliability/documentation.

## Optimized exercises

1. **Slice:** build one ticket-creation path from form to durable row and
   response, including validation and one integration test.
2. **Change:** after it ships, add a requirement that crosses at least three
   layers; split it into reviewable commits with compatibility plan.
3. **Operate:** deploy the slice, inject a failure, diagnose through logs, add
   a regression guard, and write a brief incident record.

## Exit gate

Demo one feature, trace it across layers, describe three failure modes, show
tests at appropriate boundaries, and defend one rejected scope item.

More reps: `../../bootcamp/15-capstones/`; primary capstone:
`../02-PROJECT-BRIEF.md` and `../03-BACKLOG.md`.

