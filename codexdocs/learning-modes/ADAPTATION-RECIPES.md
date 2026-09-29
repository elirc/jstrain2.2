# Exercise adaptation recipes

Use these recipes with any exercise in the optimized 01–29 track, deep modules,
or existing repository. Change access and sequence without removing the target
capability.

## Universal conversion card

```text
Original skill:
Observable success:
Dangerous misconception:
Selected mode and current support level:
Representation:
Response artifact:
Changed-constraint transfer:
Delayed retrieval date:
```

## Explain exercise

| Mode | Adaptation |
| --- | --- |
| Build-first | Create a minimal runtime example, then explain its output and counterexample |
| Example-first | Annotate two explanations, identify the stronger causal model, then teach it cold |
| Visual | Draw mechanism, ownership, and boundary; trace two inputs |
| Verbal | Record two minutes, verify, then record a corrected version |
| Challenge | Refute a plausible false explanation with the smallest counterexample |
| Structured | Fill mechanism → example → counterexample → boundary prompts |
| Collaborative | Teach; reviewer supplies a changed case and challenges vague language |
| Adaptive | Use speech/text/diagram now, then verify independently at sustainable capacity |

## Predict exercise

| Mode | Adaptation |
| --- | --- |
| Build-first | Encode prediction as a failing/passing test before execution |
| Example-first | Predict an example, study trace, then predict a changed trace |
| Visual | Use timeline, memory graph, rows, or state diagram |
| Verbal | Narrate each transition and reason before running |
| Challenge | Include one misleading but irrelevant detail |
| Structured | Use step, state-before, operation, state-after, reason columns |
| Collaborative | Predict separately; reconcile only after both commit |
| Adaptive | Predict one representative case now and the full matrix later |

## Implement exercise

| Mode | Adaptation |
| --- | --- |
| Build-first | Walking skeleton, rejection, failure, then refactor |
| Example-first | Complete faded code, then rebuild with a changed constraint |
| Visual | Implement from contract/state/data-flow diagram |
| Verbal | Narrate contract and ownership before each boundary |
| Challenge | Repair a partial implementation with hidden edge cases |
| Structured | Use vertical checklist and 25-minute units |
| Collaborative | Driver implements; navigator tracks invariants and tests |
| Adaptive | Split by independently verifiable boundary; preserve final end-to-end proof |

## Test exercise

| Mode | Adaptation |
| --- | --- |
| Build-first | Break implementation deliberately, then write the rejecting test |
| Example-first | Compare strong and weak tests against three implementations |
| Visual | Map risk → boundary → fixture → assertion → production signal |
| Verbal | State the defect and why the test would fail before code |
| Challenge | Mutation contest: distinguish several plausible wrong versions |
| Structured | One risk and test layer per task card |
| Collaborative | One writes mutant; the other writes discriminating evidence |
| Adaptive | Write decision table first; automate cases across later sessions |

## Debug/review exercise

| Mode | Adaptation |
| --- | --- |
| Build-first | Produce executable reproduction before reading widely |
| Example-first | Compare expert trace with yours, then solve a similar defect |
| Visual | Hypothesis tree plus cross-layer causal path |
| Verbal | Incident briefing with facts, hypotheses, and decisive evidence |
| Challenge | Use withheld root cause and request observations explicitly |
| Structured | Reproduce → narrow → hypothesize → test → regress → fix checklist |
| Collaborative | Silent review first; classify findings before discussion |
| Adaptive | Capture reliable reproduction/restart state; narrow in small units |

## Apply exercise

| Mode | Adaptation |
| --- | --- |
| Build-first | Smallest deployable vertical slice |
| Example-first | Analogous slice, then change one business rule |
| Visual | Model three traces and turn them into acceptance tests |
| Verbal | Demo to user, engineer, reviewer, and operator audiences |
| Challenge | Ship feature, then inject timeout, duplicate, race, or denial |
| Structured | One vertical ticket with evidence at every boundary |
| Collaborative | PR simulation with adversarial review and author response |
| Adaptive | Deliver across capacity-sized slices, then run one independent full-flow review |

## Topic-specific representation guide

| Topics | High-value representations |
| --- | --- |
| 01–06 | Memory graphs, scope/lifetime diagrams, value tables, error chains |
| 07–08 | Event-loop timelines, promise trees, cancellation/resource maps |
| 09–11 | Operation-cost tables, invariants, before/after transformation pipelines |
| 12, 16–19, 23 | Process/stream sequences, byte boundaries, HTTP flows, transaction timelines |
| 13 | DOM tree, focus order, event propagation, component state chart |
| 14–15 | Dependency diagrams, ADR comparisons, vertical-slice maps |
| 20–21, 24–25, 29 | Risk/test matrices, hypothesis logs, change-impact maps |
| 22, 27 | Entity diagrams, tiny row sets, join cardinality, query plans |
| 26 | Threat/data-flow diagrams and authorization matrices |
| 28 | Request-identity timelines, cache state charts, retry decision tables |

## Anti-shortcut check

After adapting, ask:

- Does the learner still make the important decision?
- Is there an observable result rather than familiarity?
- Is failure or a counterexample included?
- Does support fade?
- Is there transfer after a meaningful detail changes?
- Is delayed independent retrieval scheduled?

If any answer is no, the adaptation made the task easier without preserving learning.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/ADAPTATION-RECIPES-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
