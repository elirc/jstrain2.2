# 29 · Write the Test

Every other module in this track hands you a test suite and asks for an
implementation. This one hands you the implementations and asks for the
**test**.

That is the direction the job actually runs in. Nobody arrives at work to find
a red suite describing the feature they were about to build. They arrive to
find a bug report, and the first real move is to write the test that fails
because of it.

## How these work

Each file gives you a `Check…` function to fill in. It receives an
implementation and must:

- **return normally** when the implementation is correct
- **throw** when it is broken

You are graded by a meta-test: your check is run against the reference
implementations and against each planted defect. Green means your suite
accepts everything that is right and rejects everything that is wrong — which
is the only definition of a good test suite there is.

| # | file | ★ | What it drills |
| --- | --- | --- | --- |
| 01 | `01-catch-the-bug.cs` | ★★★ | boundaries · degenerate inputs · asserting invariants |
| 02 | `02-test-an-endpoint.cs` | ★★★ | HTTP contracts · defaults · status *and* body |
| 03 | `03-behaviour-not-shape.cs` | ★★★ | accepting three correct implementations, rejecting five wrong ones |
| 04 | `04-one-reason-to-fail.cs` | ★★☆ | a failure that names the rule it broke |
| 05 | `05-properties-not-examples.cs` | ★★★ | round-trip and idempotence, over generated inputs |
| 06 | `06-tests-that-do-not-flake.cs` | ★★★ | determinism, and never asserting on luck |

Do 01 and 02 first — they establish the format. After that, order does not
matter.

## The five arguments this module makes

**A happy-path suite is nearly worthless, and it looks exactly like a good
one.** In `01`, four of the six broken implementations satisfy
`Truncate("hello world", 8)`. In `02`, five of six broken endpoints answer
`?page=2&pageSize=5` correctly. In `05`, *every* broken pair round-trips the
four examples anybody writes by hand. All three suites would be green, all
three would have coverage, and all three would ship the bug.

What tells implementations apart is never the middle of the range. It is the
boundary, the degenerate input, the default nobody passes explicitly, and the
invariant that holds for inputs you did not think of.

**A test can also fail on code that is correct**, and that failure mode does
more damage. `03` has three correct sorts that disagree about allocation,
mutation and identity — none of which the contract mentions. Pin any of them
and the suite goes red on a refactor, and a suite that cries wolf gets
ignored. **Say exactly what you mean, and nothing else**: everything extra
becomes a promise somebody has to keep.

**A failure should name what broke.** `04` makes that literal by asking for
the label, but the underlying habit is ordinary: one assertion per rule
instead of one compound condition. Same bugs caught, and the red line tells
you which rule rather than that a boolean was false.

**Properties beat examples where it counts.** `05`'s four bugs each need a
different shape of input — a run past nine, a repeat that is not adjacent, the
empty string, more runs than anyone tests with. You cannot enumerate the cases
you have not thought of, but you can generate over them. Fix the seed so the
failure is reproducible, and put the counterexample in the message.

**A test that passes by luck is not a test.** `06` is graded on giving the
same verdict thirty times running, in both directions. "Different seeds
produce different samples" is true almost always — and almost always is how a
team learns to re-run a red build instead of reading it.

## Two habits worth stealing

**Write the assertion that would have caught it.** When you fix a bug, the
test you add is not "does this feature work". It is "does *this specific
wrong thing* still happen". That test is cheap, it never goes stale, and it
is the only thing standing between you and the same regression next quarter.

**Do not pin what you did not promise.** The solution to `02` deliberately
asserts nothing about the error body's shape; `03` says nothing about
mutation; `06` says nothing about two seeds differing. In each case the
contract was silent, so the test is too.

## Where the mechanisms are explained

Module 21 (testing web apps) covers the tooling. This module is about
judgement — *which* assertions to write — and it is worth coming back to
after you have shipped something. Module 25's README has a real example: a
concurrency test that passed by luck was removed from this track for exactly
the reason `06` exists.

---

**Stuck?** Work backwards from the list of implementations: for each broken one, ask "what single input would tell this apart from the correct one?" — and for each *correct* one, ask "what would my check have to assume to reject this?" · **Next:** you're at the end — see `csbootcamp/README.md` for where to go next
