# Build-first mode

Use this mode when a concrete outcome creates energy and reading without a
problem does not stick. You learn the mechanism just in time, through a thin
working slice.

## Sixty-minute session

1. **Outcome — 5 minutes:** write one user-visible behavior and two rejection cases.
2. **Skeleton — 10 minutes:** create the smallest callable boundary and failing test.
3. **Build — 25 minutes:** implement one complete path without optional abstraction.
4. **Break — 10 minutes:** inject invalid input, dependency failure, or duplicate action.
5. **Explain — 5 minutes:** describe ownership and causal flow without the editor.
6. **Queue — 5 minutes:** record the next risk and delayed reconstruction date.

## Adapt a mastery exercise

- Convert Explain into a tiny executable demonstration, then narrate why each
  output occurs.
- Convert Predict into a failing test before observing runtime behavior.
- Keep Implement mostly unchanged but add a rejection and cleanup path.
- Convert Test into “make a plausible broken implementation, then catch it.”
- Convert Debug/review into an executable reproduction before reading surrounding code.
- Convert Apply into the thinnest React → API → domain → data slice.

## Adapt a project increment

Begin with one walking skeleton: button/form, request, command, repository,
database row, response, rendered result, and log. Hard-code only replaceable
presentation choices, never authorization or domain truth. Add each adjacent
rule as a new acceptance example.

For inventory reservation, do not start by creating every catalog table. Seed
one product and warehouse, expose one reservation action, persist it atomically,
render the result, and force two callers to compete for the last unit.

## AI role

Ask AI for:

- the smallest acceptance slice;
- adversarial inputs after your first implementation;
- a review of hidden coupling and untested failure;
- questions about your tradeoff.

Do not ask for the whole feature before creating your skeleton. If AI writes a
large block, reduce it until you can rebuild each boundary unaided.

## Failure signals and correction

- **Random edit/run cycles:** pause and write the expected output plus governing rule.
- **Happy-path tunnel vision:** force one rejection, retry, and cleanup scenario.
- **Growing architecture before behavior:** delete unused seams or justify them with
  the next known consumer.
- **Working code you cannot explain:** switch the review phase to Verbal teach-back.
- **Cross-layer confusion:** switch one session to Visual modeling.

## Exit evidence

Produce a working vertical slice, one before/after failure test, a five-box data
flow, a two-minute explanation, and a blank-file rebuild within three days.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/02-BUILD-FIRST-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
