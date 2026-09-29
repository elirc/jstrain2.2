# 08 · Debug Hunts

**The compiler is not a test suite.**

Every other module in this track is graded twice and you fight the first
grader: the type errors are the todo list, and when tsc goes quiet you
are nearly done. This module deletes that loop. All twelve files are
type-clean under `tsc --strict` on the first run — `✔ types clean`, every
time — and every one of them is wrong. The tests are red before you touch
anything.

That gap is the entire lesson. `strict` catches an enormous amount: a
misspelled field on a typed object, an argument in the wrong position, a
`possibly undefined` you forgot to handle, a union member you never
narrowed. What it cannot catch is anything that depends on the VALUES
rather than the shapes — which default is meaningful, which layer wins a
merge, whether the JSON you were handed actually looks like the interface
you wrote about it. A green build means "these shapes are consistent with
each other". It has never meant "this code is correct", and the day you
stop hearing the second thing is the day TypeScript starts costing you.

Do this module after **TS-06**. You need to have written the guards, the
narrowing and the boundary casts yourself before it is interesting to
watch them fail.

## The mental model

**1. The boundary rule.** A type is a promise made at compile time.
Runtime data has never read it and cannot be made to.

```ts
const user = JSON.parse(body) as User;   // a claim
const user = parseUser(body);            // a check
```

Both lines produce a `User` as far as tsc is concerned. Only one of them
produces a `User` as far as the next line is concerned. Everywhere data
crosses INTO your program — `JSON.parse`, `fetch`, `process.env`, a DB
row, a socket message, an `any` from an untyped dependency — the type on
that value is a hope until something has compared it against the data.
Inside the boundary, types are excellent and you should trust them
completely. At it, they are decoration until you back them.

**2. Four steps, in this order.** The hunt is not "read the file until
something looks wrong". Reading for wrongness is how you read the same
correct line nine times.

```
1 · failing test first   what EXACTLY is wrong? 0 instead of 5, null
                         instead of 0, empty instead of three items?
                         The shape of the wrong answer names the class.
2 · trace ONE value      pick the single number/string that is wrong and
                         walk it backwards to where it was born. One
                         value, not the program.
3 · name the shape       say the class out loud: "a falsy default",
                         "an unchecked lookup", "a mutated argument".
                         Named bugs have known fixes.
4 · smallest fix         one operator, one word, one copy. If your fix
                         is ten lines you have not found it yet.
```

Step 1 is the one people skip. `expected: 0 · received: 250` has already
told you it is a defaults bug; `expected: 0 · received: null` has already
told you a guard rejected something. Read the diff before the code.

**3. Wrong answers have accents.** After a while you hear the class
before you find the line.

| the symptom | what it almost always means |
| --- | --- |
| `NaN` | a lookup missed, or a parse failed, several frames back |
| `undefined` where a value should be | a name that does not exist on the object |
| the DEFAULT when you passed a real value | `\|\|` where `??` belonged |
| a suspiciously neutral 0 / '' / 'unknown' | a `default:` branch answered for a case |
| an empty result, not a wrong one | the work had not happened yet — a dropped promise |
| right answer, broken CALLER | a mutating method reached through an alias |
| passes alone, fails after its neighbour | shared mutable state |
| `x.foo is not a function` | something asserted a shape the data lacks |

## The thesis: what `--strict` does and does not catch

This is the table the module exists to teach. Everything in the bottom
half is a bug you will ship with a green build unless a test or a review
catches it.

| bug class | `tsc --strict` |
| --- | --- |
| misspelled property on a TYPED value | **yes** — TS2339 |
| wrong argument type, wrong arity | **yes** — TS2345 / TS2554 |
| `null`/`undefined` you forgot to handle | **yes** — TS18047, TS2532 |
| a union member you never narrowed | **yes** — usually |
| a missing `return` on some path | **yes** — TS2366, when the type is annotated |
| an excess property on a fresh object literal | **yes** — TS2353 |
| property access on an `any` | no — `any` means "stop checking" |
| data that does not match what you `as`-ed | no — an assertion is a claim, not a check |
| `undefined` from a missing `Record` key | no — needs `noUncheckedIndexedAccess`, not in `strict` |
| a union call where both members answer | no — the types agree, the MEANINGS differ |
| a `switch` missing a case, with a `default` | no — exhaustiveness is something you ask for |
| `\|\|` where `??` was meant | no — both are perfectly typed |
| spread / merge order | no — order is runtime; the result type is identical |
| mutating an argument, or a shared default | no — TS models shape, never ownership |
| a dropped promise (`forEach(async …)`) | no — a promise is legal where `void` is expected |
| a type guard whose body is wrong | no — `x is T` is taken entirely on trust |

Three of those have a flag (`noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`) or a linter
(`@typescript-eslint/no-floating-promises`) behind them, and the
solutions say which. The rest are yours.

## Exercises

Tests start RED. `1 failed` on the first run is the exercise being
delivered, not a broken file.

| # | file | ★ | target | the hunt |
| --- | --- | --- | --- | --- |
| 01 | `01-any-leak.ts` | ★☆☆ | 10m | a config file, three fields, one that never changes |
| 02 | `02-as-cast-lie.ts` | ★☆☆ | 10m | a feed you do not own, and eleven characters of promise |
| 03 | `03-nullish-vs-or.ts` | ★☆☆ | 10m | an option bag where one legitimate value keeps vanishing |
| 04 | `04-narrowing-hole.ts` | ★★☆ | 15m | two types, one method name, two different meanings |
| 05 | `05-record-lookup.ts` | ★★☆ | 15m | a rate table, a total, and a NaN with no return address |
| 06 | `06-mutable-default.ts` | ★★☆ | 15m | requests that remember each other |
| 07 | `07-discriminated-fallthrough.ts` | ★★☆ | 15m | a ledger that nets out too high, and a switch with nothing to say |
| 08 | `08-readonly-alias.ts` | ★★☆ | 15m | the leaderboard is right; the board is not |
| 09 | `09-promise-void.ts` | ★★☆ | 20m | the answer arrives empty, and then the work finishes |
| 10 | `10-type-guard-bug.ts` | ★★★ | 20m | one payload wrongly rejected, one wrongly accepted, one predicate |
| 11 | `11-partial-merge.ts` | ★★★ | 20m | three layers of settings, and a comment the code disagrees with |
| 12 | `12-boss-review.ts` | ★★★ | 40m | a PR marked ready to merge: three bugs, three classes, ten tests |

Do them in order — 01–03 are the boundary bugs, 04–09 the language ones,
10–11 the ones where your own abstraction lied to you, and 12 asks for
all of it at once as a code review. Targets assume you read the prompt,
run the tests, and hunt; if you are still reading the file after twice
the target, take the hint line and start again from the failing test.

**About the hints.** 01–03 have none — at ★☆☆ the file is short enough
that the search IS the exercise. 04–12 each carry one `hint:` that
teaches a diagnostic MOVE (what to log, what to hover, what to check by
hand) and never names the bug. Using it early costs you nothing except
the rep you came for.

**The rules of the hunt.**

1. **One bug per file** (12 has exactly three, one per area, and the
   test names tell you which area). When you find it, stop looking.
2. **Minimal fixes only.** Rewriting the function until the tests pass
   is not the skill; a rewrite is how you delete a bug you never
   understood, along with three you did not notice.
3. **Do not touch the tests.** They describe the contract. If a test
   looks wrong, you have misread the prompt.
4. **The type tests at the bottom of every file already pass** — in the
   broken version and in the fixed one. They are there to prove the
   point: tsc was satisfied the whole time.
5. **Predict before you fix.** Say what the fix will change about the
   failing value BEFORE you run it. Being surprised by your own patch
   means you found a symptom, not a cause.

**Workflow.** From this directory:

```
node ../run.js exercises/01-any-leak.ts
```

You will see `✔ types clean` followed by red tests, on every file, until
you fix it. For a tight loop `node ../run.js --tests <file>` skips tsc —
which in this module skips nothing you needed — but take the full run
before calling a file done: your fix must not introduce a type error.

`node ../progress.js 08` scores the module. Unsolved files show as
`🐛 (bug not fixed yet)` rather than the usual `✘ N failing` — red tests
mean "not started" here, and the scoreboard knows it.

When you finish a file, read the solution's `Walkthrough:` block even if
you nailed it in three minutes. Each one is structured the same way —
bug class, the tell, **why tsc could not catch it**, the minimal fix —
and the third line is the one to remember. Twelve of those is a working
model of where the type system's authority ends.

---

**Stuck?** `cheatsheets/typescript.md` (Reading tsc errors; the
strict-family flags) · `cheatsheets/js-gotchas.md` (the runtime half) ·
**Self-check:** `quizzes/09-spot-the-bug.md` · **Next:** the JS twin,
`bootcamp/24-debug-hunts` — twenty-five more of these with no type system in
the room at all.
