# 25 · Codebase Debug Hunts

Module 24 taught you to find the lying line in one file. This module
removes the comfort you didn't know you had: **the whole bug in front of
you**. Here every exercise is a small app spread over several files, the
failing test points at the entry point, the stack trace points at an
innocent bystander, and each file — read alone — is defensible. That is
what inheriting a codebase feels like, and it's what a real ticket hands
you: a symptom in one place, a cause in another.

The format: each exercise is a runner file plus an app directory —

```
exercises/01-shipping-quote.js          ← run this; prompt + the tests
exercises/01-shipping-quote-app/        ← the app; the bug lives in here
    rates.js   cart.js   quote.js       ← you edit ONE of these
```

Run the runner, read red, then go read the app. Fix the app file that is
wrong — the runners and their tests are not yours to edit.

## The mental model

Single-file hunting is about lines. Multi-file hunting is about
**contracts**: what each file promises (its top comment, its function
names, its parameter names) and what each caller assumes. When every
file is locally correct, the bug is a disagreement between a promise and
an assumption — so stop reading bodies and start diffing boundaries.

The three disagreements that cover most of them, one per exercise:

| boundary bug | how it reads | file that owns the fix |
| --- | --- | --- |
| broken promise | a doc says "throws / never null / already sorted"; the body stopped doing that | the file that made the promise |
| wrong pipeline order | every step is right; the composer calls them in an order one step documented away | the file that composes |
| unit mismatch | a bare number changes meaning across an import — seconds→ms, dollars→cents | the sender who mislabeled it |

And one rule from module 24 gets a sharper edge here: **the crash site
tells you which VALUE went wrong, never which FILE did.** Walk the value
backwards across imports until you cross the boundary where a comment
and a call site disagree. Then — and only then — edit.

## The details that bite

1. **Fixing at the crash site.** Adding a guard where the TypeError
   fired makes the test green and leaves the broken promise armed for
   the next caller. Fix the file named in the "owns the fix" column,
   or you are the on-call patch that made exercise 01 necessary.
2. **Doc comments are evidence, not decoration.** In these hunts the
   top comment of each file is load-bearing spec. Read all of them
   BEFORE any body — it's five lines a file, and the diff between two
   of them usually IS the bug.
3. **Parameter names carry units and preconditions.** `ttlMs`,
   `rawEmail`, `startMs` — when a call site feeds them something whose
   name disagrees (`CACHE_FOR = 300 // five minutes`), believe the
   receiver.
4. **Don't widen a strict function to accept bad input.** If validate
   documents "expects normalized input", teaching it to repair raw
   input forks the definition of clean across two files. Compose
   correctly instead.

## Exercises

| # | file | ★ | the hunt |
| --- | --- | --- | --- |
| 01 | `01-shipping-quote.js` | ★★☆ | a TypeError two files from the promise that broke |
| 02 | `02-signup-order.js` | ★★★ | three correct functions, one wrong order |
| 03 | `03-report-cache.js` | ★★★ | a five-minute cache that lasts a third of a second |

```
node exercises/01-shipping-quote.js     # red until you fix the app
node solutions/01-shipping-quote.js     # the fix + walkthrough
node ../verify.js 25                    # the whole module
node ../progress.js 25                  # the scoreboard
```

As in module 24: red is the starting state, 🐛 in the scoreboard means
"not solved yet", and the walkthrough (in the solution runner) names the
bug class, the tell, and why the fix belongs in that file — read it
after your attempt, not during. The solution's app directory holds the
fixed file for diffing against yours.

---

**No "Stuck?" line here, on purpose** — reinforcement and hunt modules send you looking for the reference yourself; that retrieval is the rep. · **Next:** `bootcamp/26-security-hunts`
