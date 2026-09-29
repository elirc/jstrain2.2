# 07 · Reinforcement Drills

Modules 01–06 taught you the type system. This one asks whether you still
have it. Every file here is a SECOND rep of something you have already
done once — same skill, new domain, no scaffolding — and the skills were
chosen by looking at what actually shows up in a working codebase and in
an interview: discriminated unions, `unknown` at the boundary,
`keyof`/indexed-access generics, DTO shaping, `satisfies` vs `as`, and
reading a compiler error fast.

Nothing here is new material. That is the point.

## Why cold reps

Re-reading a lesson feels like learning and mostly is not. What moves a
skill from "I follow it" to "I can produce it under pressure" is
**retrieval** — pulling the answer out of an empty head, failing, and
finding out immediately. The failing part is not a side effect; the
effort of the retrieval is the thing that lays the track down.

So the rules for this module are different:

- **No `hint:` lines.** Every other module has one. These deliberately do
  not — a hint is a partial answer, and a partial answer replaces the
  retrieval you came for.
- **Cold first.** Give yourself ten minutes before you scroll back to
  01–06. If you look it up in minute one you have practised looking
  things up.
- **Predict, then compile.** Write down what you think tsc will say
  before you run it. In 11 that IS the exercise; do it everywhere.
- **Space them.** Anything you scored 0 or 1 on (see the rubric), do
  again in two days from a blank file. Same day does not count.

## When to do this module

You can start after **TS-04**. Eleven of the fourteen need nothing beyond
unions, narrowing, generics and the utility types:

```
after TS-04   01 02 03 04 05 06 07 08 10 11 13
after TS-06   09 12 14
```

09 rebuilds the utility types as mapped and conditional types (TS-05),
12 leans on `Parameters`/`ReturnType` and argument tuples (TS-05), and 14
is the boss mix — it wants all of it. Doing them earlier is not fatal,
just slower than it needs to be.

## The rules of the graders

**`@ts-expect-error` staying an error IS the test.** Each of those lines
marks something that must NOT compile once your types are right. If you
loosen a type until the illegal line compiles, tsc reports
`TS2578: Unused '@ts-expect-error' directive` — which is itself an error.
There is no version of `any` that makes this module go green. Same for
`!`: it silences a possibly-undefined error by asserting something you
have not checked.

**Two graders, both must be quiet.** `tsc --strict` first, tests second.
A file is done when tsc says nothing and the tests are green. In 10, 11
and 13 the runtime tests pass from the very first run — those three are
pure type work, and tsc's output is the whole todo list.

**`Expect<Equal<A, B>>` is exact.** It distinguishes `readonly`,
optional, literal vs widened, and `any` from everything. "Close enough"
shows up as `TS2344: Type 'false' does not satisfy the constraint 'true'`.

## Score rubric

Score each file the moment you finish it, before you look at the
solution. Be honest; the number is only useful as a scheduling signal.

| score | what happened | what to do |
| --- | --- | --- |
| 3 | wrote it cold, inside the target time, tsc quiet on the first or second run | done — move on |
| 2 | wrote it cold but overran, or fought tsc for a while | re-read the solution's walkthrough, move on |
| 1 | had to go back to modules 01–06 for the shape of it | re-drill in 2 days |
| 0 | opened the solution file | re-drill tomorrow, then again in 3 days |

A 1 is not a failure, it is a scheduling instruction. The only wrong
answer is reading the solution first and scoring it a 3.

## The details that bite

These are the ones this module's own files will catch you on.

1. **`Array.prototype.find` returns `T | undefined`.** Always. Decide
   what missing means in one line; `!` is not a decision.
2. **A computed key in an object literal widens.**
   `{ ...form, [key]: value }` types as `T & { [x: string]: T[K] }`, not
   `T` — every `setField` in the wild carries one `as T` for this.
3. **`typeof` on a `let` reports the NARROWED type**, not the declared
   one, which is why 10 grades `LOG_LEVEL` by assignment probes rather
   than an `Expect<Equal>`.
4. **`(...args: Parameters<F>) => ReturnType<F>` is not IDENTICAL** to
   the signature it came from — it behaves the same at every call site
   but fails `Equal`. Capture `<A extends unknown[], R>` when identity
   matters (12).
5. **`satisfies` keeps the literal keys; an annotation flattens them.**
   `keyof typeof ROUTES` is `'/health' | '/users'` with the first and
   plain `string` with the second.
6. **`'code' in e` narrows to a property of type `unknown`**, not
   `string`. The `typeof` after it is the check that does the work.
7. **A guard is only as strong as its weakest field.** `'id' in value`
   passes a numeric id; `typeof status === 'string'` passes `'PAID'`.
   04 has fixtures built to walk through exactly those gaps.
8. **`Object.keys` returns `string[]` by design.** Asserting
   `as (keyof T)[]` is fine for an object you own and a lie for parsed
   JSON.
9. **Indexing an object type with a plain `string` is `TS7053`.** The fix
   is `keyof typeof MAP`, not an index signature — the index signature
   changes the API.
10. **`Readonly<T>` and `as const` are one level deep** and neither
    freezes anything at runtime. 11 tests that with `Object.isFrozen`.
11. **`never` is the honest empty union.** `done: never` in a transition
    map is what makes "nothing may follow done" a compile error.
12. **tsc reports where the mismatch is DETECTED, not where the mistake
    was made.** The `TS2322` in 13 lands on an assignment; the cause is a
    return type two lines above it.

## Exercises

| # | file | ★ | target | what you drill |
| --- | --- | --- | --- | --- |
| 01 | `01-form-event-reducer.ts` | ★★☆ | 20m | a form-event union, an exhaustive switch, `assertNever` |
| 02 | `02-socket-message-match.ts` | ★★★ | 30m | `Handlers<R>` per variant + a `match(msg, handlers)` router |
| 03 | `03-job-lifecycle.ts` | ★★★ | 35m | per-state payloads; illegal transitions that do not compile |
| 04 | `04-boundary-guards.ts` | ★★☆ | 25m | guards that reject four specific broken fixtures |
| 05 | `05-catch-triage.ts` | ★★☆ | 20m | `toError` / `errorCode` / `safeRun` over `unknown` |
| 06 | `06-keyof-queries.ts` | ★★☆ | 20m | `sortBy` / `whereEq` / `project` — `keyof` + `T[K]` |
| 07 | `07-form-patch.ts` | ★★★ | 25m | `setField(form, key, value)` and `diff` → `Partial<T>` |
| 08 | `08-employee-dtos.ts` | ★★☆ | 20m | five API views from one type, each pinned exactly |
| 09 | `09-rebuild-the-utilities.ts` | ★★★ | 35m | the same five views with the built-ins taken away |
| 10 | `10-satisfies-or-as.ts` | ★★★ | 30m | six declarations, six goals, pick the right tool |
| 11 | `11-widening-prediction.ts` | ★★☆ | 20m | predict what tsc infers for eight declarations |
| 12 | `12-wrapper-signatures.ts` | ★★★ | 30m | `wrap` / `after` / `memoizeWeak` keeping the signature |
| 13 | `13-tsc-error-triage.ts` | ★★☆ | 15m | six real tsc errors; read, diagnose, fix |
| 14 | `14-boss-mix.ts` | ★★★ | 45m | one feature: union in, guard, keyof update, DTO out |

Seven core, seven stretch. Order does not matter much — each file stands
alone — but 01→02→03 is a real progression, 08 before 09 is worth it, and
14 is the one to finish on. Targets are wall-clock guides for a cold rep,
not a competition; tsc is slow on this machine and thinking time is not
the same as compile time.

**Workflow.** From this directory:

```
node ../run.js exercises/01-form-event-reducer.ts
```

Types print first, then the tests. For a tight loop use
`node ../run.js --tests <file>` (skips tsc) and lean on your editor's
squiggles, then take the full run before you call a file done.
`node ../progress.js 07` shows the module at a glance.

When you are finished with a file, read the solution's `Walkthrough:`
block even if you scored a 3 — it is where the WHY lives, and in 13 it is
the actual lesson: error → cause → the ten-second fix path.

---

**No "Stuck?" line here, on purpose** — reinforcement and hunt modules send you looking for the reference yourself; that retrieval is the rep. · **Next:** `tsbootcamp/08-debug-hunts`
