# Bootcamp authoring format — the contract

Every module in `bootcamp/` follows this format exactly. It is optimized for
offline solo study: every file is self-contained, runnable with plain
`node <file>`, and readable top-to-bottom without jumping between files.

## Module layout

```
bootcamp/NN-topic-name/
├── README.md          the lesson (read first, ~10 min)
├── exercises/
│   ├── 01-short-name.js
│   ├── 02-short-name.js
│   └── ...
└── solutions/
    ├── 01-short-name.js   same tests, working code, + walkthrough comment
    └── ...
```

- Two-digit numbering, kebab-case names, identical filenames between
  `exercises/` and `solutions/`.
- Everything is ESM (`bootcamp/package.json` has `"type": "module"`).
- Zero dependencies. Node standard library only.

## Exercise file template

```js
// ─────────────────────────────────────────────────────────────────────────
//  07 · debounce                                          ★★☆ core
//  concepts: closures · timers
//  run: node 07-debounce.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Real-world setup in one or two sentences, then exactly what to build.
//  Show concrete input → output examples:
//
//      debounce(fn, 50)   → a function that delays fn until 50ms of quiet
//
//  hint: setTimeout returns an id; clearTimeout(id) cancels it

import { test, eq, ok, spy, sleep } from '../../_lib/check.js';

export function debounce(fn, ms) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a function', () => {
  ok(typeof debounce(() => {}, 10) === 'function');
});

// ...4–8 focused tests total
```

Rules:

1. **Header block**: number · name, difficulty stars + tier, `concepts:`
   line, `run:` line. Difficulty: `★☆☆ warm-up`, `★★☆ core`,
   `★★★ stretch`.
2. **Prompt**: 3–15 comment lines. Concrete examples with `→` arrows.
   One `hint:` line for ★★☆ and up (put it last; it's below the fold of
   attention). Never reveal the whole approach.
3. **Starter code**: exported function(s) with real parameter names and
   `throw new Error('TODO');` as the body. For multi-part exercises, one
   TODO per function. Keep any provided scaffolding (fixture data, helper
   types) ABOVE the tests divider.
4. **Tests**: 4–8 per exercise, after the divider line. Test names read as
   a spec ("is case-insensitive", not "test 2"). Cover the happy path,
   one edge case minimum, and — where it teaches something — the tricky
   case that catches the naive solution.
5. Available from `../../_lib/check.js`: `test, eq, ok, throws, rejects,
   approx, spy, sleep`. `test` handles async fns. `eq` is deep-strict.
6. Timers in tests: keep total waiting under ~300ms per file; use
   generous tolerances (assert order/counts, not exact milliseconds).
   Never depend on wall-clock dates, locale, or randomness in assertions.
7. Comment lines ≤ 78 chars. Code style: modern ESM, `const`/`let`,
   single quotes, semicolons.

## Solution file template

Identical file, with:
- ` — SOLUTION` appended to the header name line,
- a `Walkthrough:` comment block (3–10 lines) after the header explaining
  the approach and WHY, naming the concept it drills, and the classic
  wrong turn if there is one,
- the TODO replaced by a clean, idiomatic implementation,
- the SAME tests, unchanged.

Both files must run green under `node`:
- exercise file → all tests report `todo`, exit code 0
- solution file → all tests pass, exit code 0

## Module README.md (the lesson)

Structure, in order — total read ~8–12 minutes:

```md
# NN · Topic Name

One-paragraph "why this matters" hook.

## The mental model
The 2–4 core ideas, each with a tiny runnable code snippet.

## The details that bite
Numbered list of gotchas/edge cases with one-line code proof each.

## Cheat table (optional)
Small md table if the topic is API-shaped (array methods etc.).

## Exercises
| # | file | ★ | what you build |
table listing every exercise, marking which are core vs stretch.
Then: "Do the warm-ups and core in order. Stretch if time allows."
```

Tone: direct, second person, no fluff, no "in this section we will".
Explain like a sharp senior explaining to a junior on a whiteboard.

## The README footer (every module has one)

The last line of every module README is a one-line footer, after a
`---` rule. Two variants, and which one you get is a rule, not a mood:

**Teaching modules** (01–20, 22, 27, 28, `tsbootcamp/01–06`) point at
the reference, the recall check, and the next stop:

```md
**Stuck?** `cheatsheets/x.md` (what's in it) · **Self-check:** `quizzes/NN-y.md` · **Next:** `bootcamp/NN-next`
```

Optionally a `**Deep dive:** guides/NN-….md` between them.

**Reinforcement and hunt modules** (21, 23, 24, 25, 26, 29,
`tsbootcamp/07`, `tsbootcamp/08`) deliberately DROP the `Stuck?` and
`Self-check:` links. Finding the reference yourself — deciding that this
is a Map question and going to look up the Map sheet — is the retrieval
those modules exist to train; handing over the link does the retrieval
for the student. They still carry a `Next:`, so the path never
dead-ends, and they say why the hint line is missing:

```md
**No "Stuck?" line here, on purpose** — … · **Next:** `bootcamp/NN-next`
```

## Debug / hunt modules (dir name contains `-debug`, or ends in `-hunts`)

These invert the contract: the student reads instead of writes. The
"ships-red" behaviour is triggered by the module directory name — either
`-debug` anywhere in it (e.g. `24-debug-hunts`) or an `-hunts` suffix
(e.g. `26-security-hunts`). `verify.js`, `progress.js`, and the DOM
`verify-dom.js` (which keys on the FILE name, so a browser hunt is named
`NN-debug-*.html`) all share this rule.

- The exercise ships **complete, plausible code** — no stubs, no `TODO` —
  with a planted defect: ≥1 failing test and 0 todos. `verify.js` enforces
  both halves; a debug exercise that already passes has no bug to find and
  is reported broken.
- The prompt states the CORRECT behaviour and the symptom. It never names
  the bug, the line, or the fix — that IS the exercise.
- The solution is the **minimal** fix (usually one line), plus the usual
  `Walkthrough:` block naming the bug CLASS — off-by-one, stale closure,
  shared mutable default, floating promise — so the next one is
  recognisable on sight.
- `progress.js` shows a still-red debug exercise as 🐛, not ✘: red is the
  starting state here, not a scolding.
- Everything else is per the normal contract: header block, prompt style,
  4–8 tests, file naming, `_lib/check.js`, comment width.

## Verification (mandatory before you finish)

From the module directory run every file:

```
for f in solutions/*.js;  do node "$f" || echo "BROKEN $f"; done
for f in exercises/*.js;  do node "$f" || echo "BROKEN $f"; done
```

Every solution must end `all green — next file!`. Every exercise must
report only `todo` (0 failed — a failed test in an exercise means your
test doesn't match the starter or scaffolding is broken). Fix before
finishing; do not report done with red files.
