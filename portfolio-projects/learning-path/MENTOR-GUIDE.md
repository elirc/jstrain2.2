# Mentor guide

## Coaching stance

Ask for an observation before accepting a theory. Do not rescue syntax immediately. The learning objective is ownership and judgment, not memorizing framework APIs.

Useful prompts:

- “What contract are you trying to preserve?”
- “Which layer can actually prove that claim?”
- “Show me the query or test that establishes tenant scope.”
- “What happens if the response is lost after commit?”
- “Which write survives if this line throws?”
- “What does the user see?”
- “How would an operator diagnose this at 2 AM?”

## Three-stage support

### Stage 1: guided intern

Provide entry files and one risk. Require a diagram and prediction. Pair on the first critical test.

### Stage 2: independent junior

Provide acceptance criteria and constraints, not file names. Review plan before code. Ask for negative and failure evidence.

### Stage 3: mid-level trial

Provide an ambiguous but bounded outcome. Candidate identifies affected layers, risks, and compatibility. Mentor reviews only at plan and final diff gates unless data safety is at risk.

## Weekly cadence

- Monday: candidate frames one ticket and risk matrix.
- Tuesday: first failing critical test and design review.
- Wednesday: vertical implementation.
- Thursday: adversarial test, operations, and diff review.
- Friday: demo, teach-back, and one rejected alternative.

## Debug-hunt rules

- Inject only one primary defect.
- Preserve a reproducible symptom.
- Do not reveal the layer.
- Score hypothesis quality and evidence gathering, not speed alone.
- Candidate must leave a regression test and update documentation if assumptions changed.

Suggested defects:

- inventory movement omitted from one adjustment path;
- project search query missing tenant predicate;
- scheduling overlap uses `<=` and rejects back-to-back intervals;
- worker marks delivered before adapter success;
- React applies a stale response after organization switch.

## Review rubric shorthand

Use G/I/O:

- **Guided:** succeeds with implementation-level direction.
- **Independent:** succeeds from a clear outcome and explains evidence.
- **Owning:** handles ambiguity, failure modes, tradeoffs, and review.

Promote responsibility only when repeated evidence exists across feature work, debugging, review, and operations.

## What not to reward

- large diffs without a risk model;
- many shallow tests that mirror implementation;
- “production-ready” claims without measured workload;
- framework abstractions the learner cannot explain;
- green CI achieved by weakening types, lint, or assertions;
- AI-generated explanations the learner cannot reproduce.
