# Visual modeling mode

Use this mode when the difficulty is relationships rather than syntax: identity,
state, time, ordering, ownership, data flow, cardinality, or deployment overlap.
A useful diagram makes a prediction; decoration does not.

## Choose the correct visual

| Question | Visual |
| --- | --- |
| Who owns or calls what? | Dependency/component diagram |
| What happens over time? | Sequence or timeline |
| Which states and transitions are legal? | State machine |
| How do records relate? | Entity-relationship diagram |
| What is copied, shared, or mutated? | Memory/identity graph |
| How does data cross trust boundaries? | Data-flow/threat diagram |
| Which versions coexist? | Deployment compatibility matrix |
| Why is a query wrong? | Tiny input/output tables and cardinality notes |

## Sixty-minute session

1. Draw the model from memory — 10 minutes.
2. Add invariants, trust boundaries, and failure points — 10 minutes.
3. Predict one success and two failures by tracing the visual — 10 minutes.
4. Implement or debug from the model — 20 minutes.
5. Update only parts disproved by evidence — 5 minutes.
6. Narrate the visual without code — 5 minutes.

## Diagram standard

Every arrow has a label. Every state transition names its triggering command
and rejection. Every data store notes its source of truth. Every trust boundary
names validation and authorization ownership. Mark assumptions differently
from observed evidence.

## Adapt a mastery exercise

- Runtime/closures: draw bindings, objects, scopes, and lifetimes.
- Async/Node: draw scheduling and settlement timelines plus resource cleanup.
- HTTP/React: draw request identity, client states, cancellation, and errors.
- SQL/data: draw cardinalities, constraints, transaction boundaries, and rows.
- Security: draw actors, assets, interpreters, trust boundaries, and controls.
- Debugging: draw symptom-to-boundary narrowing and competing hypotheses.

Then implement or test one prediction. The visual alone is not completion.

## Adapt a project increment

Before a high-risk command, create a one-page model. For checkout, show request,
transaction, reservation, outbox, payment worker, provider, webhook, and
reconciliation. Trace commit-success/response-loss and provider-success/local-
timeout. Convert each trace into a deterministic test.

## AI role

Ask AI to challenge missing arrows, ambiguous ownership, impossible states, and
unmodeled failure. Do not let AI produce the first diagram; comparing its model
with yours is the learning event.

## Failure signals and correction

- **Large boxes with unlabeled arrows:** replace them with explicit messages or calls.
- **Diagram never changes a prediction:** shrink it or choose a different visual.
- **Only the happy path appears:** overlay timeout, duplicate, denial, and crash paths.
- **Diagram diverges from runtime:** instrument the boundary and update the model.
- **Time spent styling:** use plain text, Mermaid, or paper and resume implementation.

## Exit evidence

Keep the before and corrected visual, three traced scenarios, tests derived from
the traces, and a five-minute architecture explanation.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/04-VISUAL-MODELING-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
