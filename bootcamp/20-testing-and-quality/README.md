# 20 · Testing and Quality

Module 15 had you build a test framework. This module is about the harder
half: writing code that can be tested at all, and knowing the techniques
that separate a suite people trust from a suite people delete. Almost
every "untestable" function is really a function with a hidden input — it
reaches for `Date.now()`, `Math.random()`, the filesystem, the network —
and almost every flaky test is one of three things: time, order, or shared
state. You will fix all of that by hand here. Sixteen exercises, and every
one of them makes you BUILD the tool: fakes, a fake clock, a fake timer
wheel, a seeded PRNG, a property-based tester with shrinking, a snapshot
runner, a contract suite. When you next open vitest's docs you will not be
learning an API, you will be recognising your own code with better
ergonomics.

## The mental model

**1. Testability is a design property, not a testing skill.** If a unit is
hard to test, the unit is telling you something. Every hidden input —
clock, randomness, environment, IO — becomes a parameter, and the test
supplies a fake. That is the entire trick, repeated in six shapes.

```js
// untestable: you would have to wait 30 minutes
const isExpired = () => Date.now() - lastTouch >= 30 * 60_000;

// testable: the test owns time
const isExpired = () => clock.now() - lastTouch >= timeoutMs;
```

**2. A test is arrange, act, assert — and the name is the spec.** Three
beats, in that order, and a title that says what the code DOES ("is
case-insensitive", "expires exactly at the timeout"). If the name is
"test 2" you have written a regression detector, not a specification.

```js
test('touch restarts the countdown', () => {
  const clock = makeFakeClock(0);              // arrange
  const s = createSessionTimer(clock, 30_000);
  clock.advance(29_000); s.touch();            // act
  clock.advance(29_000);
  eq(s.isExpired(), false);                    // assert
});
```

**3. Determinism is non-negotiable.** A test that passes 99 times out of
100 is worse than no test: it trains the team to re-run CI instead of
reading failures. Randomness gets a seed, time gets a fake, order gets
fresh state per test. Anything you cannot replay, you cannot debug.

```js
makeRandom(42).next() === makeRandom(42).next();   // always true
```

**4. Assert behaviour, not implementation.** Test what a caller can
observe. `spy.callCount` on an internal helper locks in today's structure
and breaks on every refactor; the same test written against the returned
value survives the rewrite and still catches the bug.

```js
eq(store.keys(), ['2', '1']);       // behaviour: what a caller sees
eq(store.internalOrderArray, ...);  // implementation: a refactor tax
```

## The details that bite

1. **Flaky has three causes: time, order, shared state.** Fix them at the
   source, never with a retry. `await sleep(10)` is a guess about the
   machine you happen to be on — `await flushPromises()` is not.
2. **`Date.now()` and `Math.random()` inside a unit are hidden globals.**
   You cannot stub a call you cannot see. Injecting them costs one
   parameter and buys you the boundary tests you could not otherwise write.
3. **The boundary is where the bug is.** "Expires after 30 minutes" is
   `idle >= timeout`, not `>`. With the real clock you cannot even land on
   the boundary; with a fake clock you test it in two lines.
4. **A shared fixture is a time bomb.** Hoist the defaults object out of
   your builder and every user shares one `address` — test 7 mutates it and
   test 9 goes red with no explanation.
   ```js
   ok(makeUser().address !== makeUser().address);   // must hold
   ```
5. **Over-mocking tests your mocks.** If every collaborator is a stub, the
   suite passes while the app is broken. Contract tests are the antidote:
   one suite, run against the fake AND the real thing.
6. **Any counter or patch you make, you must unmake in a `finally`.** A
   spy that does not restore leaks into the next test; a `delete` that
   should have been an assignment (or the reverse) leaks a property.
   ```js
   Object.hasOwn(obj, 'greet');   // ask BEFORE patching
   ```
7. **`Object.is(NaN, NaN)` is `true` — but NaN is close to nothing.** Both
   facts are correct and your assertion has to pick. Same energy:
   `typeof null === 'object'` and `typeof [] === 'object'`, which is why a
   shape matcher needs its own type-namer.
8. **`Object.keys` reorders integer-like keys.**
   ```js
   Object.keys({ '2': 'b', '1': 'a' });   // ['1', '2'] — insertion order lost
   ```
9. **A snapshot you re-bless without reading has stopped testing.**
   `UPDATE_SNAPSHOTS` belongs on the mismatch path only; a runner that
   rewrites every run can never fail.
10. **100% coverage is a floor, not a proof.** Four inputs can hit four
    branches and still miss the negative number, the empty array and the
    missing field. Coverage tells you what you did NOT test; it never tells
    you that you tested enough.
11. **A failure message is the product.** `expected a truthy value` costs
    you ten minutes; `value.address.zip: expected string, got number` costs
    you none. Put the values, the tolerance and the path in the message.
12. **Shrinking finds a LOCAL minimum.** Greedy stops at the first plateau,
    so `[10, 9]` is minimal-ish, not provably minimal. Real libraries carry
    the same caveat — knowing it stops you from over-reading the report.

## What you build → what it is called in the real world

| You build | The real thing | Where you have met it |
| --- | --- | --- |
| `stub` / `fake` / `spyOn` | test doubles | `vi.fn()`, `vi.spyOn`, sinon |
| `makeFakeClock` | injected clock | `vi.setSystemTime`, `Clock` in Go/Java |
| `createFakeScheduler` | fake timers | `vi.useFakeTimers()`, `jest.advanceTimersByTime` |
| `makeRandom(seed)` | seeded PRNG | seeded fixtures, deterministic simulation |
| `makeUser` / `builder` | object mother, test data builder | factory-bot, fishery, faker |
| `forAll` + generators | property-based testing | fast-check, QuickCheck, Hypothesis |
| `shrink` | shrinking | fast-check's minimal counterexamples |
| `snapshotTest` | golden files | `toMatchSnapshot`, `jest -u` |
| `flushPromises` | microtask flush | `await Promise.resolve()` idiom, `flush-promises` |
| `runContractTests(factory)` | contract / conformance suite | testcontainers, driver test kits |
| `expectClose` / `expectMatchesShape` | custom matchers | `toBeCloseTo`, `toMatchObject`, zod |

## Exercises

| # | file | ★ | what you build |
| --- | --- | --- | --- |
| 01 | `01-test-doubles.js` | ★☆☆ | `stub` and `fake` — call recording, `lastCall`, deep `calledWith`, and a fake that records a throw and re-throws it |
| 02 | `02-spy-on.js` | ★★☆ | patch a method in place, keep `this`, and restore it so cleanly that an inherited method leaves no own property behind |
| 03 | `03-data-builders.js` | ★☆☆ | `makeUser(overrides, nextId)` — nested defaults that merge, arrays that replace, and no two users sharing an address |
| 04 | `04-fluent-builder.js` | ★★☆ | `builder(defaults)` generating a `withX` per key, immutable so one base builder is safe to share |
| 05 | `05-injectable-clock.js` | ★★☆ | a fake clock with `advance`, and the session timer refactored to read time through it — including the exact expiry boundary |
| 06 | `06-fake-scheduler.js` | ★★★ | the timer wheel: `setTimeout`/`clearTimeout`/`advance`/`runAll`, nested timers, a runaway guard — then `debounce` with zero real waiting |
| 07 | `07-seeded-random.js` | ★★☆ | mulberry32 plus `int`, `pick` and a Fisher-Yates `shuffle`: same seed, same everything |
| 08 | `08-async-flush.js` | ★★☆ | `flushPromises`, and a concurrency-limited queue whose middle states you assert without a single sleep |
| 09 | `09-branch-coverage.js` | ★★☆ | choose the minimal input set that reaches all four branches — and prove no input in it is redundant |
| 10 | `10-expect-close.js` | ★★☆ | a float assertion with a message worth reading, an inclusive boundary, and opinions about NaN and Infinity |
| 11 | `11-expect-shape.js` | ★★☆ | a structural matcher that recurses, reports `value.address.zip`, and is not fooled by `typeof null` |
| 12 | `12-property-forall.js` | ★★★ | `forAll` plus composable generators — the whole property-testing engine, replayable from a seed |
| 13 | `13-property-shrink.js` | ★★★ | shrinking: candidate lists for ints and arrays, and the greedy walk that turns noise into a minimal counterexample |
| 14 | `14-property-practice.js` | ★★★ | express real properties — round trip, involution, idempotence — and let one deliberately false one get caught and shrunk |
| 15 | `15-snapshot-testing.js` | ★★★ | golden files: write on first run, diff after, rewrite only under `UPDATE_SNAPSHOTS` |
| 16 | `16-contract-tests.js` | ★★★ | one suite, two implementations: write the KV store that passes the same contract as the Map — and watch it catch the plausible-looking one |

Do the warm-ups and core in order — 01 to 11 build on each other in
concept if not in code, and the fake clock in 05 is what makes 06 make
sense. Stretch if time allows: 12 → 13 → 14 is one arc and worth doing as
one sitting, 15 and 16 stand alone.

```
node exercises/05-injectable-clock.js     # yours
node solutions/05-injectable-clock.js     # the reference, all green
node ../verify.js 20                      # the whole module at once
```

---

**Stuck?** `cheatsheets/node-advanced.md` (the testing section) · **Self-check:** `quizzes/12-node-advanced.md` — the testing questions · **Next:** back to `bootcamp/15-capstones`, or FLIGHTPLAN-NODE-TS.md for whatever is still open.
