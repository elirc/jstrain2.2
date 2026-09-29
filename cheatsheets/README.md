# Cheatsheets

Fifteen offline reference sheets. No internet needed — this pack replaces MDN for the flight.

## Top of mind

| I need… | Go to |
| --- | --- |
| "Does this method mutate?" | [array-methods.md](array-methods.md) · [string-methods.md](string-methods.md) |
| "Why is my async code out of order?" | [promises-async.md](promises-async.md) |
| "What does this weird output mean?" | [js-gotchas.md](js-gotchas.md) |
| "Why won't this compile, and what is TS2345?" | [typescript.md](typescript.md) |
| "Child process or worker thread? Where's my backpressure?" | [node-advanced.md](node-advanced.md) |
| "Is this fast enough?" | [big-o.md](big-o.md) |
| "How do I say this in an interview?" | [big-o.md](big-o.md) · [patterns-swe.md](patterns-swe.md) |

## The index

| Sheet | Reach for this when… | Contains |
| --- | --- | --- |
| [array-methods.md](array-methods.md) | You're mid-`.reduce()` and need to know what something returns or whether it mutates | Master table grouped by transform / search / test / order / combine, mutating↔copying pairs, the `sort` comparator rules, 15 recipes (groupBy, dedupe by key, chunk, zip, top-N…) |
| [string-methods.md](string-methods.md) | You're wrangling text — casing, padding, splitting, or an emoji broke your `.length` | Method table, `slice` vs `substring`, template literals & tagged templates, unicode and surrogate-pair traps, the `$&`/`$1`/`$<name>` replacement table, 17 recipes |
| [object-map-set.md](object-map-set.md) | You're deciding between a plain object and a `Map`, or a clone just went shallow on you | `Object.*` statics, destructuring & optional chaining, `Map`/`Set`/`WeakMap` APIs and the ES2025 set operations, object-vs-Map decision table, `structuredClone` vs spread vs JSON round-trip |
| [promises-async.md](promises-async.md) | Something resolved in the wrong order, or you need to run N things in parallel without melting the server | ASCII event-loop diagram + ordering rules, the `all`/`allSettled`/`race`/`any` combinator table, serial-vs-parallel patterns, the common-bugs table, recipes (timeout, retry, concurrency pool, debounce) |
| [dom-api.md](dom-api.md) | You're doing anything in a browser without a framework | Selecting, creating & inserting, `classList`, attributes vs properties, the events table, delegation, forms & `FormData`, `localStorage` |
| [node-api.md](node-api.md) | You're writing a script and can't remember whether it's `fs.promises` or `fs/promises` | `fs/promises`, `path`, `process`, `URL`, `crypto`, `events`, streams, an HTTP server in 10 lines, the CommonJS↔ESM table, CLI flags |
| [regex.md](regex.md) | You're staring at a pattern that almost works | Token reference (classes, quantifiers, anchors, groups, lookaround), the flags table with the `lastIndex` bug, the `test`/`match`/`matchAll`/`replace`/`split` matrix, 12 patterns broken down piece by piece |
| [es2020-plus.md](es2020-plus.md) | You want to know if you can use a feature, and since when | `?.` `??` `??=`, `structuredClone`, `at()`, `Object.hasOwn`/`groupBy`, `toSorted`/`with`, `findLast`, `Array.fromAsync`, `Promise.withResolvers`, `#private`, top-level await — each with what/why/example/ES year, plus what Node 22 actually ships |
| [big-o.md](big-o.md) | You're sizing up an approach, or an interviewer just said "and the complexity?" | Complexity classes with an ASCII chart, big-O of every array/object/Map/Set/string operation (with measured timings), data structures, classic algorithms, and a 12-point interview playbook |
| [js-gotchas.md](js-gotchas.md) | The output makes no sense and you're starting to doubt the language | 30 traps: `typeof null`, `0.1+0.2`, `NaN!==NaN`, default `sort`, `splice` vs `slice`, closures in loops, `this` in callbacks, TDZ, `==` coercion, floating promises, `Array(3)` holes… |
| [patterns-swe.md](patterns-swe.md) | You're naming things, structuring a module, or deciding where to catch an error | 12 design patterns (intent · ≤10-line JS example · real library that uses it), SOLID in JS terms, composition vs inheritance, error-handling strategy, naming and small-function heuristics |
| [webdev-fundamentals.md](webdev-fundamentals.md) | You need the theory: HTTP, CORS, caching, or what a bundler actually does | URL-to-first-paint as a numbered story, HTTP methods/status/headers tables, REST conventions, cookies vs storage, CORS in plain words, bundlers & transpilers, the rendering pipeline |
| [typescript.md](typescript.md) | `tsc` is shouting a number at you, or you can't remember which utility type does what | Syntax reference (annotations, functions, generics, classes), the narrowing toolbox, utility-type master table, 8 mapped/conditional/`infer` recipes, the strict-family flags in plain words, decoding TS2322/2339/2345/2551/2739/18048, `interface` vs `type` and `enum` vs `const` object decision boxes |
| [node-advanced.md](node-advanced.md) | You're past `fs.readFile` — spawning processes, fighting the event loop, or leaking a stream | Event-loop lanes diagram + ordering table, `exec`/`execFile`/`spawn`/`fork` matrix with the injection demo, `worker_threads` patterns and when they pay off, backpressure & `pipeline`, `node:sqlite` reference, HTTP server/client patterns (loopback tests, ETag/304, keep-alive, gzip), `AsyncLocalStorage`, CLI exit codes, atomic write + lockfile, testing vocabulary |
| [interview-behavioral.md](interview-behavioral.md) | The interview round that isn't a coding screen — "tell me about a time…" or "design a URL shortener" | STAR answer shape, the six stories to prepare, questions to ask them, the four-move system-design-lite template with a worked example, the meta-rules (think out loud, state assumptions) |

## How these are built

Every sheet has the same shape, so you can jump in anywhere:

1. `# Title` and a one-line purpose.
2. A **Top of mind** table — the 3–5 things you'll look up most, answered right there.
3. `##` sections, tables over prose, every example ≤ 3 lines.
4. A `See also` footer linking the sibling sheets.

**Accuracy.** Examples were executed on **Node v22.16.0** (Windows) rather than recalled; the
TypeScript sheet was checked against **TypeScript 5.9.3** with `tsc --noEmit --strict --target es2022`,
so every quoted compiler error is verbatim. Where a
feature exists in the spec but not in Node 22.16 — `RegExp.escape`, `Promise.try`,
`import.meta.main` — the sheet says so, because you can't check on the plane. Browser-only APIs in
[dom-api.md](dom-api.md) and [webdev-fundamentals.md](webdev-fundamentals.md) are the exception:
those are stated conservatively, not executed.

**Conventions.** `Mutates?` columns say exactly `yes`/`no`. Version columns use the ES year
(`ES2020` … `ES2025`). `// =>` marks a return value, `// logs:` marks console output.

## Suggested flight plan

This is the zero-energy alternate — the reading-only route, for when you are too
tired to write code. The main schedules live in [`../FLIGHTPLAN.md`](../FLIGHTPLAN.md)
and [`../FLIGHTPLAN-NODE-TS.md`](../FLIGHTPLAN-NODE-TS.md); these sheets are the
reference you reach for *during* those, not a competing itinerary.

| Hours | Do this |
| --- | --- |
| 1 | Read [js-gotchas.md](js-gotchas.md) start to finish — it's the highest bug-per-minute density here |
| 2 | Skim [array-methods.md](array-methods.md) and [string-methods.md](string-methods.md) recipes; try to recall each before reading the answer |
| 1 | [promises-async.md](promises-async.md) event-loop section, then predict the ordering quiz before checking |
| 1 | [big-o.md](big-o.md) tables, then the interview playbook out loud |
| 1 | [regex.md](regex.md) — build each of the 12 patterns from the breakdown without looking |
| 1 | [typescript.md](typescript.md) narrowing + utility tables, then cover the "reading tsc errors" table and name each code from its shape |
| 1 | [node-advanced.md](node-advanced.md) event-loop lanes and the streams section, then quiz file 12 |
| rest | [patterns-swe.md](patterns-swe.md) and [webdev-fundamentals.md](webdev-fundamentals.md) as reading; the rest as reference |

---
*Part of the jstrain2.2 bootcamp. The lessons and exercises live in [`../bootcamp/`](../bootcamp/).*
