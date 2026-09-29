# Project-learning adaptations

Use this with RelayDesk or any brief in `../crud-projects/`. The project
requirements and completion bar remain unchanged; modes change how you enter,
represent, sequence, and demonstrate the work.

## One increment through every mode

Example: add concurrency-safe inventory reservation.

| Mode | Entry activity | Required final evidence |
| --- | --- | --- |
| Build-first | Create one reservation endpoint and UI action | Complete slice plus last-unit race test |
| Example-first | Annotate a smaller transaction example and fade it | Independent reservation design with changed constraint |
| Visual | Draw two callers, locks/versions, rows, commit, response | Timeline-derived deterministic test |
| Verbal | Explain invariant, transaction boundary, and conflict | Recorded defense plus executable evidence |
| Challenge | Begin with overselling reproduction | Root-cause fix and regression |
| Structured | Work through vertical ticket checklist | Evidence attached to each gate |
| Collaborative | Driver builds; reviewer attacks race/auth/error | Classified review and author response |
| Adaptive | Split model, transaction, test, UI across capacity | Later independent end-to-end verification |

## Requirement-learning modes

- **Ambiguous ticket:** Structured guided to list assumptions, then Collaborative
  review with AI as product owner.
- **New mechanism:** Example-first with faded support, then Build-first transfer.
- **Cross-layer behavior:** Visual model, Build-first implementation, Verbal defense.
- **Production defect:** Challenge/debug-first, then Structured incident report.
- **Security change:** Visual trust boundary plus Collaborative adversarial review.
- **Maintenance change:** Challenge-first impact discovery and Example-first only
  for unfamiliar local conventions.

## Evidence substitutions

These substitutions preserve capability:

- typed narration may replace handwritten prose;
- an accessible digital diagram may replace a whiteboard;
- a keyboard-driven demo may replace pointer interaction;
- asynchronous written review may replace live pair discussion;
- several small sessions may replace one long session;
- a local simulated provider may replace a paid external service.

These do **not** preserve capability:

- explanation without runnable behavior for an implementation ticket;
- code without explanation because speaking/writing is uncomfortable;
- mocked repositories when the risk is SQL transaction behavior;
- manual clicking when the risk requires repeatable regression evidence;
- AI-generated proof that you cannot reproduce or defend;
- cutting the concurrency, authorization, or failure case to finish faster.

## Mode-balanced increment checklist

- [ ] Entered through a mode that addressed the current barrier
- [ ] Wrote a cold attempt or prediction
- [ ] Used the correct representation for the system relationship
- [ ] Built a complete vertical outcome
- [ ] Tested the riskiest negative/concurrent behavior
- [ ] Received human, AI, runtime, or reference feedback
- [ ] Explained decisions and one rejected alternative
- [ ] Faded temporary scaffolding
- [ ] Scheduled changed-constraint retrieval
- [ ] Recorded accessibility or environment improvements

## Graduation remains performance-based

Regardless of mode, you must independently add a vertical feature, diagnose an
unfamiliar defect, write a discriminating test, review a risky change, explain
the architecture, and describe deployment/recovery. A preferred representation
may support preparation, but the final task should resemble real engineering work.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/PROJECT-ADAPTATIONS-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
