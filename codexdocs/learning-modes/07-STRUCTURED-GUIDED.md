# Structured guided mode

Use this mode when open-ended tasks, too many files, or unclear sequencing block
the first useful action. Structure externalizes executive load. The scaffolding
must fade as the workflow becomes familiar.

## Definition-of-ready card

Before work, fill only these fields:

```text
Outcome:
One representative example:
Two rejection examples:
Files/boundaries likely involved:
First failing check:
Timebox:
Stop condition:
```

If a field is unknown, create a five-minute discovery action rather than a
large “research” task.

## Twenty-five-minute unit

1. Re-read the outcome and select one unchecked action — 2 minutes.
2. Predict the result — 3 minutes.
3. Work on only that action — 15 minutes.
4. Run the narrowest check and record evidence — 3 minutes.
5. Write the next physical action — 2 minutes.

After two units, take a real break. End after four units or earlier when the
planned stop condition is reached.

## Adapt a mastery exercise

Split it into:

- reproduce or restate the contract;
- list known inputs/states;
- predict one case;
- implement or investigate one mechanism;
- test one failure;
- explain one tradeoff;
- schedule transfer and retrieval.

Check one item only when evidence exists. Do not convert “understand promises”
into a task; use “predict and verify the order of these six callbacks.”

## Adapt a project increment

Use a vertical ticket checklist:

- [ ] Acceptance and non-goals
- [ ] Domain rule and authorization decision
- [ ] Migration/constraint
- [ ] Repository behavior
- [ ] API contract and errors
- [ ] React states and accessibility
- [ ] Failure/concurrency/idempotency case
- [ ] Logs/metrics and rollback impact
- [ ] Widening checks and explanation

Do not work down all database tasks across features. Complete this list for one
small user outcome.

## AI role

Ask AI to turn your stated outcome into tasks of 5–25 minutes and to identify
missing dependencies. Require it to preserve the vertical slice and label
optional work. Do not allow it to implement unchecked tasks automatically.

## Failure signals and correction

- **Checklist grows faster than output:** cut scope to one acceptance example.
- **Checking based on effort:** require a link, command result, or explanation.
- **Endless preparation:** first failing test must appear in the first two units.
- **Dependence on exact steps:** remove every second prompt on the next repetition.
- **Unexpected issue derails session:** record it, choose whether it blocks the
  current outcome, and defer it explicitly if not.

## Exit evidence

Keep the ready card, completed vertical checklist, verification output, next
action, and a later attempt performed with half the prompts.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/07-STRUCTURED-GUIDED-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
