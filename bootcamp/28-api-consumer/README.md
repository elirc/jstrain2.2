# 28 · Consuming APIs

Module 18 builds servers; this module is the other half of every CRUD
job — being a good CLIENT of one. Real network calls fail, paginate, and
must never double-charge, and the patterns that handle that are the same
five everywhere, framework or not. All offline: every "network" here is a
fake function you inject, so tests are instant and deterministic.

- **Retry with backoff** — survive transient failures without hammering.
- **Cursor pagination** — drain a paged endpoint to exhaustion.
- **Error envelopes** — turn responses and throws into one `Result`.
- **Idempotency keys** — make retrying a POST safe.
- **Boundary validation** — parse untrusted JSON into a shape you trust.

## The mental model

The network is the least trustworthy boundary your code touches: it is
slow, it fails halfway, and it hands you data you did not type. Three
habits tame it:

1. **Assume failure and make it safe.** Retry transient errors with
   EXPONENTIAL backoff (and jitter in production), and pair retries with
   idempotency keys so a repeated write happens once. A retry without
   idempotency is how customers get charged twice.
2. **Return Results, don't throw across the boundary.** Collapse network
   errors and HTTP errors into one value callers branch on. Only parse a
   body you know is a success; an error payload has a different shape.
3. **Validate once, at the edge.** Parse untrusted input into a known,
   normalized shape and hand THAT to the rest of the app — "parse, don't
   validate". After the boundary, code should never re-check.

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-retry-backoff.js` | ★★☆ | retry with a doubling, injected-clock backoff |
| 02 | `02-paginate-cursors.js` | ★★☆ | follow nextCursor until it's null |
| 03 | `03-error-envelope.js` | ★★☆ | responses + throws → one `{ ok, data \| error }` |
| 04 | `04-idempotency-key.js` | ★★★ | charge-once under retries |
| 05 | `05-validate-boundary.js` | ★★★ | parse signup JSON, collect every error |

01 and 04 are a pair — retries make calls reliable, idempotency makes the
retries safe. Do them near each other.

```
node exercises/01-retry-backoff.js   # run it, fill the TODO, re-run
node solutions/01-retry-backoff.js   # reference + walkthrough
node ../progress.js 28               # scoreboard
```

**Stuck?** `cheatsheets/promises-async.md` (combinators, the recipes) · **Deep dive:** `guides/05-http-from-first-principles.md` · **Self-check:** `quizzes/12-node-advanced.md` · **Next:** `bootcamp/29-write-the-test`
