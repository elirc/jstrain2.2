# Topic-to-mode routing matrix

This is a starting route, not a mandate. Use the cold task and current barrier
to override it. “Primary” introduces or repairs the mental model; “reinforce”
creates transfer or review evidence.

| # | Topic | Primary mode | Reinforce with | Best artifact |
| --- | --- | --- | --- | --- |
| 01 | Language core | Visual modeling | Challenge/debug | Memory graph and coercion prediction table |
| 02 | Functions and closures | Visual modeling | Verbal teach-back | Scope/lifetime diagram and delayed-callback test |
| 03 | Arrays and objects | Build-first | Pattern/analogy | Identity assertions and transformation table |
| 04 | Strings, regex, collections | Example-first | Challenge/debug | Input partitions and parser counterexamples |
| 05 | Prototypes and classes | Visual modeling | Pattern/analogy | Property-lookup trace and design comparison |
| 06 | Errors and robustness | Simulation | Verbal teach-back | Error translation chain and cleanup evidence |
| 07 | Async mastery | Visual modeling | Challenge/debug | Event-loop timeline and controlled race test |
| 08 | Iterators, generators, modules | Example-first | Build-first | Pull/yield trace and dependency diagram |
| 09 | Data structures | Pattern/analogy | Challenge/debug | Operation-cost/invariant decision table |
| 10 | Algorithms and patterns | Challenge/debug | Verbal teach-back | Complexity estimate and adversarial cases |
| 11 | Functional programming | Example-first | Pattern/analogy | Effect boundary and before/after pipeline |
| 12 | Node fundamentals | Build-first | Reading/reference | Byte/stream/process boundary tests |
| 13 | DOM and browser | Build-first | Visual modeling | DOM/focus/event model plus accessible test |
| 14 | Design patterns | Pattern/analogy | Collaborative review | Pattern card with harmful look-alike |
| 15 | Capstones | Outcome/portfolio | Simulation | Vertical slice, ADR, demo, and defense |
| 16 | Node CLI tooling | Build-first | Simulation | Real-process stdout/stderr/exit tests |
| 17 | Advanced Node async | Visual modeling | Challenge/debug | Backpressure/worker timeline and measurements |
| 18 | Node HTTP APIs | Reading/reference | Build-first | Wire contract and real-server integration tests |
| 19 | Node persistence | Visual modeling | Challenge/debug | Crash-point timeline and rollback test |
| 20 | Testing and quality | Challenge/debug | Collaborative review | Named defect, mutant, and discriminating test |
| 21 | Interleaved drills | Challenge/debug | Verbal teach-back | Mixed cold attempt and misconception log |
| 22 | SQL joins | Visual modeling | Example-first | Tiny row sets, cardinality, result table, plan |
| 23 | Node drills | Challenge/debug | Build-first | Timeboxed integrated mechanism and review |
| 24 | Debug hunts | Challenge/debug | Structured guided | Reproduction and hypothesis/evidence log |
| 25 | Codebase debug hunts | Visual modeling | Simulation | Codebase/change-impact map and minimal fix |
| 26 | Security hunts | Simulation | Collaborative review | Threat/data-flow model and exploit regression |
| 27 | SQL data | Visual modeling | Reading/reference | ERD, constraints, transaction and query plan |
| 28 | API consumer | Visual modeling | Build-first | Request/cache state chart and out-of-order test |
| 29 | Write the test | Challenge/debug | Collaborative review | Plausible mutant and red/green evidence |

## Mode-specific routes through 01–29

### Build-first route

Start `01 → 02 → 03 → 06 → 07`, then build `12 → 18 → 19 → 20 → 27 → 28`.
Use `24 → 25 → 26 → 29` to attack what you built. Do each lesson just before
the project behavior that needs it.

### Example-first route

For each Tier-A topic: optimized lesson → one worked example → one faded
example → Implement rung → changed Apply task. After topic 07, begin the
project and route back only when evidence reveals a gap.

### Visual route

Prioritize `01`, `02`, `07`, `12`, `18`, `19`, `22`, `25`, `26`, `27`, and
`28`. Each visual must predict three traces and generate at least one test.

### Verbal route

Use every exit gate as a two-minute recording. Add five-minute design defenses
after `06`, `14`, `15`, `18`, `19`, `20`, `26`, and `27`. Re-record only after
runtime or review evidence changes the explanation.

### Challenge route

Begin with a Debug/review task in each Tier-A bank. Route backward to Explain or
Example-first only for the mechanism that blocked diagnosis. Retest with a
different defect after one week.

### Structured route

Use the Tier-A order from the optimized index. Limit each session to one rung
or one vertical project checklist. Advance after 4/5 cold rung tasks, not after
reading completion.

### Outcome-first route

Begin with project claims: strict boundary validation, race-safe command,
authorized API, compatible migration, accessible async UI, and incident repair.
Use this matrix to select the smallest missing topic for each claim.

## Switching rules

- Diagram exists but implementation stalls → Build-first.
- Code works but explanation/test is weak → Verbal or Challenge/debug.
- Challenge produces random guessing → Example-first or Structured guided.
- Reading creates familiarity without recall → close sources and use Challenge.
- Checklist advances without project behavior → Outcome-first.
- Work repeatedly stops because capacity varies → Adaptive energy/accessibility.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/TOPIC-MODE-MATRIX-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
