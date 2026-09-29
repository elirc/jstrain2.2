# 29 · Write the Test

The complement to the debug hunts. In module 24 you were handed a failing
test and hunted the bug; here you are handed the BUG and must write the
test that catches it. This is the "why didn't CI catch this?" muscle,
trained directly — because the answer, nearly always, is "the test was
too weak", and this module makes you feel that from the other side.

## How it grades

Each file gives you two implementations of the same function — one
`correct`, one `buggy` — that agree on the obvious inputs and diverge only
on an edge. You fill in `assertCorrect(fn)`: a test that calls `fn` and
throws when it misbehaves. The grader runs your test twice:

- against `correct` → it must **pass** (not throw)
- against `buggy` → it must **fail** (throw)

A test that passes both is too weak and stays red. You cannot fake it by
throwing unconditionally either — that would reject the correct
implementation. The only way green is a test that pins the ACTUAL
behavior, edge included.

## The mental model

A passing test suite is evidence of nothing until you know what it
exercised. Strong tests come from asking, before you write the fixture:

1. **What's the emptiest input?** `[]`, `''`, `0`, `null` — the cases a
   happy-path fixture skips and bugs love.
2. **Does the fixture have the structure the behavior needs?** "Capitalize
   every word" needs more than one word; "dedupe" needs a duplicate that
   isn't adjacent; a range check needs values ON the boundary.
3. **Could a trivial wrong answer pass?** If `return 0` or `return input`
   passes your test, add a case that rules it out.

The habit these build is the same one that makes you a fast reader in the
debug modules: knowing where bugs hide means knowing where to look — and
where to test.

## Exercises

| # | file | ★ | the case a weak test misses |
| --- | --- | --- | --- |
| 01 | `01-sum-empty.js` | ★★☆ | the empty array |
| 02 | `02-title-case.js` | ★★☆ | the second word |
| 03 | `03-in-range-boundary.js` | ★★★ | the endpoints |
| 04 | `04-dedupe-nonadjacent.js` | ★★★ | duplicates spread apart |

```
node exercises/01-sum-empty.js   # red until your test is strong enough
node solutions/01-sum-empty.js   # a strong test + the walkthrough
node ../progress.js 29           # scoreboard
```

Do this module after module 24 — hunting bugs teaches you the shapes,
and writing the tests that catch them closes the loop. Pairs naturally
with `bootcamp/20-testing-and-quality`, which drills the mechanics
(fakes, clocks, property tests) this module puts to work.

---

**No "Stuck?" line here, on purpose** — reinforcement and hunt modules send you looking for the reference yourself; that retrieval is the rep. · **Next:** `node bootcamp/redo.js 5` — spaced retrieval on what you have already solved, or back to `FLIGHTPLAN.md`
