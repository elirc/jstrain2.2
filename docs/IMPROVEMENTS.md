# Improvements — delivered, and what's still open

The original version of this file was a gap analysis. Most of it has now
been built; this version records what landed and keeps only the genuinely
open ideas. Companion to [`OVERVIEW.md`](OVERVIEW.md).

## Delivered

**More debug hunts, new flavors** — the highest-value category.
- `bootcamp/24-debug-hunts` grew from 16 to 22: four async hunts
  (`Promise.all` collapse, cleanup-before-await, listener leak,
  concurrency scramble) and two SQL hunts (LEFT-JOIN-turned-inner, join
  fan-out). The bug-class table is now 20 families.
- `bootcamp/25-codebase-debug-hunts` (new) — bugs spread across several
  files: the crash site and the cause sit apart, the way inherited code
  and generated code actually fail. Three hunts (broken cross-file
  contract, wrong pipeline order, unit mismatch at a boundary).
- `bootcamp/26-security-hunts` (new) — close the vulnerability: SQL
  injection, XSS, path traversal, IDOR, predictable tokens, mass
  assignment. Six hunts, the CRUD-interview security round.
- `bootcamp/13` gained two browser debug hunts (`35-debug-tab-group`,
  `36-debug-delete-index`), graded live by `verify-dom.js`.
- `bootcamp/29-write-the-test` (new) — the inverse of a hunt: write the
  edge-case test that catches a known bug, graded by a meta-test that runs
  your test against both a correct and a buggy implementation.

**CRUD-job gaps.**
- `bootcamp/27-sql-data` (new) — SQL beyond joins: transactions,
  UNIQUE + UPSERT, keyset pagination, the orders/items/refunds schema
  kata, and a migration runner. All on `node:sqlite`.
- `bootcamp/28-api-consumer` (new) — retry with backoff, cursor
  pagination, error envelopes, idempotency keys, and boundary validation
  (parse-don't-validate). Closes the API-consumer and validation gaps.
- React stays in `jstrain/` (correctly — it needs a bundler), but the
  flightplans now name it as the Phase-5 frontend lane instead of a
  footnote.

**Interview gaps.**
- `quizzes/10-interview-verbal` doubled (15 → 24) and gained a
  system-design-lite strand; the full template lives in the new
  `cheatsheets/interview-behavioral.md` (STAR, six stories, the four-move
  design method with a worked example).
- `quizzes/09-spot-the-bug` expanded (15 → 24) to cover the async, SQL,
  and security classes the hunt modules teach.
- `quizzes/15-stack-traces` (new) — read a real Node stack trace, name
  the culprit line: the on-call/interview skill nothing else drilled.

**The AI-collaboration guide** — `guides/07-working-with-ai.md` (new):
why fundamentals matter MORE with AI, reviewing generated code as a bug
hunt, prompting as spec-writing, what never to delegate, and a trap
gallery of plausible-but-wrong output. Names the repo's own strategy.

**Tooling & polish.**
- `progress.js` no longer hides module 13 — it prints a "graded in the
  browser" line instead of silently dropping 36 HTML exercises from the
  denominator.
- `check.js` `throws()` now accepts an Error CLASS, so "throws a
  TypeError" specs are enforceable, not just message matches.
- `bootcamp/redo.js` (new) — spaced-retrieval tool: restores N random
  SOLVED exercises to `bootcamp/redo/` (gitignored) to rebuild from
  memory. Turns the "flight home" ritual into one command.
- The ships-red marker is generalized: a module is a hunt module if its
  dir name contains `-debug` OR ends in `-hunts` (browser hunts key on
  the file name). Documented in `_lib/FORMAT.md`.

**Second pass — the previous "still open" list, cleared.**
- `26-security-hunts` grew 6 → 10: open redirect (`07`), ReDoS with a
  timed assertion (`08`), secrets in logs (`09`, the denylist-vs-allowlist
  lesson), and a CSRF check that passes because both tokens are missing
  (`10`). The boundary table and "details that bite" grew with them.
- `24-debug-hunts` grew 22 → 25, a third wave of bugs the usual tests
  cannot reach: `23-migration-half-applied` (COMMIT where ROLLBACK
  belonged — the migrations/transaction hunt the list asked for),
  `24-lost-update-race` (read-modify-write across an await), and
  `25-property-only-bug` — four green example tests beside one red
  seeded property test, the property-test hunt, and the capstone of the
  testing thread.
- `13-dom-and-browser` gained `37-debug-escaping.html`: the browser half
  of security hunt 02, graded live in the page.
- `guides/08-react-bug-classes.md` (new) — the React rep, deepened by
  connecting it to what the hunts already taught: render-as-snapshot,
  then stale closures in effects, index keys, cleanup and StrictMode,
  the response race, mutation, derived state, JSX's security opt-outs,
  and the six test shapes that catch them. Every output in it was
  executed against `jstrain/`'s React 19 + Vitest + jsdom install.
- **The footer question is decided and documented.** Teaching modules
  keep `Stuck?/Self-check:/Next:`; reinforcement and hunt modules
  (21, 23–26, 29, `tsbootcamp/07–08`) deliberately drop the hint links —
  finding the reference yourself is the retrieval those modules train —
  and carry a `Next:` so the path never dead-ends. Missing footers were
  added, the rule is in `bootcamp/_lib/FORMAT.md`, and `22-sql-joins`
  (a teaching module that had been missed) got the full footer.

## Still open (future flights)

The list above cleared everything the last pass left. What remains is
smaller than any of it, and none of it blocks the goal.

- **More hunts, forever.** The format is still the repo's most goal-dense
  content and scales linearly: CSRF's cousins (open CORS, secrets in a
  JWT payload), a `25-codebase` hunt where the cause is in a config file,
  a DOM hunt on focus management. Each is an afternoon and pays in
  interview and code-review skill.
- **A React hunt module.** Guide 08 names six bug classes and six test
  shapes; the exercises for them live in `jstrain/` only as build tasks.
  A `jstrain/tests/react/` hunt suite — components that ship broken,
  tests already red — would be the missing rep, and the guide is the
  lesson text it would need.
- **Quiz coverage for the newest classes.** `09-spot-the-bug` predates
  lost update, commit-on-error, ReDoS, and vacuous checks;
  `13-sql.md` predates the transaction hunt.
- **A second capstone flight.** `15-capstones` is twelve mini-projects
  written before modules 21–29 existed; a thirteenth that has to survive
  a hunt (ship it, then find the planted bug in your own code a week
  later via `redo.js`) would close the loop between building and
  debugging.

## What NOT to add (unchanged)

Scope discipline is why this runs offline and alone. Still resisting:
frameworks-of-the-month (React lives in `jstrain/`), build tooling,
Docker/deploy (can't be graded offline), LeetCode-hard algorithms (module
10 covers the CRUD interview bar), and any dependency that breaks the
`node <file>`-is-the-whole-workflow promise.

---
*When an open item ships, move its line up into "Delivered" and, if it's
a shelf-level thing, into the root `README.md` tree.*
