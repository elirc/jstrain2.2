# Optimized JavaScript and Node track — topics 01–29

This track is an original, simplified companion to the existing `bootcamp/`
modules. It covers the same 29 topic slots with a stricter 80/20 filter:
learn the mechanisms that transfer to TypeScript/Node/React work, prove them
with three core exercises, and apply them to RelayDesk. Each topic also has a
30-exercise [mastery bank](mastery/README.md) for deliberate depth.

It does not replace or alter the existing material. Use the original module
when an optimized lesson exposes a weakness that needs more repetitions.

## How to use a topic

1. Read the outcome and mental model.
2. If the format blocks progress, choose a mode with the
   [adaptive selector](../learning-modes/00-MODE-SELECTOR.md).
3. Predict the example or trap before running anything.
4. Complete the three optimized exercises in order.
5. Use the mastery bank's six rungs where your prediction, implementation, or
   explanation is weak. Space these repetitions across multiple days.
6. Apply the transfer task to RelayDesk or an equivalent real project.
7. Pass the exit gate aloud without notes.

Timebox the core lesson to 60–90 minutes. Capstones and codebase topics take
longer. Do not grind all 30 mastery exercises in one sitting: test cold, select
weak rungs, and return after forgetting. If the exit gate is already easy, do
exercise 3 plus one cold mastery task from Test, Debug/review, and Apply.

## Priority route

### Tier A — required for the TypeScript/Node/React course

`01 -> 02 -> 03 -> 06 -> 07 -> 12 -> 18 -> 19 -> 20 -> 22 -> 27 -> 28`

Then complete `24 -> 25 -> 26 -> 29` as the judgment and review loop.

### Tier B — choose when the project creates the need

`04`, `05`, `08`, `11`, `13`, `14`, `16`, `17`, `21`, `23`.

### Tier C — interview or specialization depth

`09`, `10`, and selected advanced parts of other topics. Know the practical
patterns; do not let puzzle volume displace application work.

### Integration checkpoint

Use `15` after the first seven Tier-A topics, then return to it after topic 28
with a larger, multi-file project.

## Topic index

| # | Topic | Optimized outcome |
| --- | --- | --- |
| 01 | [Language core](01-LANGUAGE-CORE.md) | Predict values, coercion, identity, and boundary behavior |
| 02 | [Functions and closures](02-FUNCTIONS-AND-CLOSURES.md) | Reason about callbacks, state, `this`, and lifetimes |
| 03 | [Arrays and objects](03-ARRAYS-AND-OBJECTS.md) | Transform collections without mutation or ambiguity |
| 04 | [Strings, regex, collections](04-STRINGS-REGEX-COLLECTIONS.md) | Parse text and choose Map/Set/date tools safely |
| 05 | [Prototypes and classes](05-PROTOTYPES-AND-CLASSES.md) | Understand delegation, instances, and class tradeoffs |
| 06 | [Errors and robustness](06-ERRORS-AND-ROBUSTNESS.md) | Model failures, preserve context, and clean up reliably |
| 07 | [Async mastery](07-ASYNC-MASTERY.md) | Own ordering, failure, cancellation, and concurrency |
| 08 | [Iterators, generators, modules](08-ITERATORS-GENERATORS-MODULES.md) | Build lazy sequences and clear module boundaries |
| 09 | [Data structures](09-DATA-STRUCTURES.md) | Select structures from operation costs and invariants |
| 10 | [Algorithms and patterns](10-ALGORITHMS-AND-PATTERNS.md) | Recognize practical search, window, and traversal patterns |
| 11 | [Functional programming](11-FUNCTIONAL-PROGRAMMING.md) | Isolate effects and compose predictable transformations |
| 12 | [Node fundamentals](12-NODE-FUNDAMENTALS.md) | Use files, paths, streams, events, crypto, and HTTP safely |
| 13 | [DOM and browser](13-DOM-AND-BROWSER.md) | Build accessible browser behavior with correct lifecycle |
| 14 | [SWE design patterns](14-SWE-DESIGN-PATTERNS.md) | Apply patterns as vocabulary, not ceremony |
| 15 | [Capstones](15-CAPSTONES.md) | Integrate requirements across multiple modules and files |
| 16 | [Node CLI tooling](16-NODE-CLI-TOOLING.md) | Build composable, testable command-line programs |
| 17 | [Advanced Node async](17-NODE-ASYNC-ADVANCED.md) | Control processes, workers, streams, and backpressure |
| 18 | [Node HTTP APIs](18-NODE-HTTP-APIS.md) | Design middleware, routing, limits, and error contracts |
| 19 | [Node persistence](19-NODE-PERSISTENCE.md) | Make durable writes, migrations, and recovery explicit |
| 20 | [Testing and quality](20-TESTING-AND-QUALITY.md) | Match tests to risks and design deterministic evidence |
| 21 | [Interleaved drills](21-INTERLEAVED-DRILLS.md) | Retrieve mixed skills without topic cues |
| 22 | [SQL joins](22-SQL-JOINS.md) | Preserve rows and aggregates across relational queries |
| 23 | [Node drills](23-NODE-DRILLS.md) | Rebuild Node mechanisms under mixed constraints |
| 24 | [Debug hunts](24-DEBUG-HUNTS.md) | Diagnose single-file defects from evidence |
| 25 | [Codebase debug hunts](25-CODEBASE-DEBUG-HUNTS.md) | Trace symptoms across module boundaries |
| 26 | [Security hunts](26-SECURITY-HUNTS.md) | Find and close trust-boundary vulnerabilities |
| 27 | [SQL data](27-SQL-DATA.md) | Protect transactions, constraints, pagination, and migrations |
| 28 | [API consumer](28-API-CONSUMER.md) | Survive unreliable external APIs safely |
| 29 | [Write the test](29-WRITE-THE-TEST.md) | Create independent evidence that distinguishes buggy code |

## Completion standard

A checked topic means you completed its project transfer and can pass its exit
gate. Mastery means you can also complete representative Test, Debug/review,
and Apply tasks without step-by-step AI help. Reading a file is not completion.
Track status in `../PROGRESS.md`.

The optimized track now contains 957 exercises: 33 for each topic. The 30-task
banks are indexed in [mastery/README.md](mastery/README.md).
Every mastery problem also has a four-part companion in the
[coaching-note index](explanations/README.md).
Use [the exercise adaptation recipes](../learning-modes/ADAPTATION-RECIPES.md)
to change its representation or sequence without weakening the exit standard.
