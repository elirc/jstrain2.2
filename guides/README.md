# Guides

Eight long-form essays. These are the blog posts and conference talks you
can't stream on the plane — the *why* behind the mechanisms, written out
properly, with every claim executed rather than recalled.

They are not a third copy of the material. The three shelves divide like
this:

| shelf | shape | you reach for it when |
| --- | --- | --- |
| [`../cheatsheets/`](../cheatsheets/) | lookup tables, ≤3-line examples | you need an answer in ten seconds |
| [`../bootcamp/*/README.md`](../bootcamp/) | 10-minute lessons + exercises | you are about to write code |
| **`guides/`** (here) | 600–800-line narrative essays | the ten-second answer stopped being enough |

## The index

| # | guide | read when | pairs with |
| --- | --- | --- | --- |
| 01 | [The Event Loop, All the Way Down](01-the-event-loop-all-the-way-down.md) | Output arrives in an order you can't explain, or a process hangs at 100% CPU | [`07-async-mastery`](../bootcamp/07-async-mastery/), [`17-node-async-advanced`](../bootcamp/17-node-async-advanced/), [`23-node-drills`](../bootcamp/23-node-drills/) |
| 02 | [`this`, Prototypes, and What `new` Does](02-this-prototypes-and-what-new-does.md) | `this` is undefined in a callback, or you want to know what `class` actually compiles to | [`05-prototypes-and-classes`](../bootcamp/05-prototypes-and-classes/), [`02-functions-and-closures`](../bootcamp/02-functions-and-closures/) |
| 03 | [Values, References, and Memory](03-values-references-and-memory.md) | Something mutated that you didn't expect, a clone went shallow, or memory climbs and never comes back | [`01-language-core`](../bootcamp/01-language-core/), [`03-arrays-and-objects`](../bootcamp/03-arrays-and-objects/), [`09-data-structures`](../bootcamp/09-data-structures/) |
| 04 | [Coercion Without Tears](04-coercion-without-tears.md) | `==` surprised you, a query param did string maths, or `sort()` put 10 before 9 | [`01-language-core`](../bootcamp/01-language-core/), [`06-errors-and-robustness`](../bootcamp/06-errors-and-robustness/) |
| 05 | [HTTP From First Principles](05-http-from-first-principles.md) | Before module 18, or when a 304, a preflight, or a retry is misbehaving | [`18-node-http-apis`](../bootcamp/18-node-http-apis/), [`12-node-fundamentals`](../bootcamp/12-node-fundamentals/) |
| 06 | [How Node Actually Runs Your Code](06-how-node-actually-runs-your-code.md) | Latency is high while CPU is idle, you're weighing workers, or an import won't resolve | [`17-node-async-advanced`](../bootcamp/17-node-async-advanced/), [`12-node-fundamentals`](../bootcamp/12-node-fundamentals/) |
| 07 | [Working With AI Without Being Owned By It](07-working-with-ai.md) | You're pasting generated code you can't fully explain, or wondering why fundamentals still matter | [`24-debug-hunts`](../bootcamp/24-debug-hunts/), [`26-security-hunts`](../bootcamp/26-security-hunts/), [`29-write-the-test`](../bootcamp/29-write-the-test/) |
| 08 | [React Bugs Are JavaScript Bugs in a Costume](08-react-bug-classes.md) | A component shows the wrong thing and the hook rules aren't telling you why — or before the React track in `jstrain/` | [`24-debug-hunts`](../bootcamp/24-debug-hunts/), [`13-dom-and-browser`](../bootcamp/13-dom-and-browser/), [`jstrain/`](../jstrain/) |

## How they're built

Every guide has the same skeleton, so you can drop into any of them:

1. A hook that names the bug this knowledge prevents.
2. Numbered sections, mechanism first — ASCII diagrams over prose, and the
   *why* behind each design decision, not just the rule.
3. **Now go do** — 3–6 specific bootcamp exercises that drill the ideas.
   Reading these without doing those is entertainment, not learning.
4. **Self-test** — 3 reasoning questions with answers hidden in
   `<details>`. Say your answer out loud before you expand it.

**Accuracy.** Every runnable claim was executed on **Node v22.16.0**
(Windows 11) before it was written down — guide 08's React output comes
from this repo's `jstrain/` project (React 19, Vitest, jsdom) — outputs are pasted from real
runs, error messages are verbatim, and timings were measured on this
laptop rather than repeated from folklore. Where a measurement contradicted
the received wisdom, the guide says so (see the shapes section of guide 02
for the piece of folklore that did not survive). Browser-only behaviour —
CORS enforcement, cookie jars, `document.all`, frame budgets — is stated
conservatively and flagged as **not executed here**, the same line the
cheatsheets take.

Timings will differ on your machine. The **ratios** are the lesson.

## Suggested order

Not the numbering. Depends what you came for:

| you are | read |
| --- | --- |
| shaky on core JS semantics | 03 → 04 → 02 (values, then coercion, then objects) |
| about to do the async modules | 01 → 06 |
| about to do module 18 | 05, then 01 if the async ordering bites |
| preparing for an interview | 01 and 02 — these two produce the most questions |
| debugging something right now | 03 (memory), 06 (blocked loop), 05 (HTTP) |
| about to start the React track | 08, after module 24 has taught you the class names it reuses |

Guides 01 and 06 are a matched pair: 01 is the queues and the ordering,
06 is the threads and the process underneath them. Read them back to back
if you have the hour.

---
*Part of the jstrain2.2 bootcamp. Lookup tables live in
[`../cheatsheets/`](../cheatsheets/), the exercises in
[`../bootcamp/`](../bootcamp/), and the schedules in
[`../FLIGHTPLAN.md`](../FLIGHTPLAN.md).*
