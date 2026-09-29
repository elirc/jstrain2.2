# AI prompt library by learning mode

These prompts make AI a scaffold, reviewer, or simulator rather than the owner
of the work. Replace bracketed fields. Always inspect code and verify factual
claims against runtime behavior or primary documentation.

## Universal tutor contract

```text
Act as a tutor and reviewer, not the implementer. Ask me to commit to a
prediction or plan before giving guidance. Reveal one hint at a time. Do not
provide a finished solution unless I explicitly end the learning attempt.
Distinguish facts, inferences, tradeoffs, and style preferences. Require me to
state evidence and explain the final result without your help.

Topic/ticket: [paste]
Current support level: [S3/S2/S1/S0]
Current barrier: [paste]
```

## Build-first

```text
Help me reduce this requirement to the smallest complete vertical slice. Ask
for my acceptance example, two rejection cases, invariant, and authorization
rule. Do not write code. After I implement, review for hidden failure,
concurrency, cleanup, accessibility, and compatibility risks.
```

## Example-first

```text
Create one minimal annotated example of [mechanism]. Explain decisions, not
every syntax token. Then create a faded version with meaningful gaps and a
near-transfer task with one changed constraint. Do not show the completed faded
or transfer answer until I submit mine.
```

## Visual modeling

```text
Review my [sequence/state/ER/data-flow/memory] diagram. First ask what behavior
it should predict. Identify missing ownership, unlabeled arrows, impossible
states, trust boundaries, and failure paths. Do not redraw it for me. Give me
three scenarios that the corrected diagram must trace.
```

## Verbal teach-back

```text
Interview me about [topic/change]. Ask one question at a time and do not answer
for me. Challenge vague terms and unsupported claims. Cover mechanism,
ownership, success, failure, repetition/concurrency, alternative, test evidence,
and operational recovery. End with a changed-context question.
```

## Challenge/debug-first

```text
Give me a realistic bug involving [topic] with symptom and reproduction context,
but conceal the root cause. Reveal evidence only when I request a specific
observation. Require three ranked hypotheses. After my fix, challenge whether
the regression proves cause and introduce one nearby non-causal distraction.
```

## Structured guided

```text
Turn my stated outcome into vertical actions of 5–25 minutes. Preserve domain,
authorization, UI, API, data, test, and operational acceptance. Label blockers,
optional work, and the next single physical action. Do not implement tasks or
expand the backlog beyond the current outcome.
```

## Collaborative review

```text
Act as a skeptical senior reviewer. Read the contract and diff without assuming
author intent. Classify each comment as confirmed defect, question, tradeoff, or
style. Prioritize correctness, authorization, data, concurrency, error behavior,
tests, accessibility, compatibility, and operations. Cite concrete evidence.
```

## Adaptive energy/accessibility

```text
Preserve this acceptance criterion but divide the work into Green (60–90 min),
Yellow (20–30 min), and Red (5–15 min) artifacts. Provide an exact restart note
for every stopping point. Do not quietly remove the hard correctness or security
requirement; defer independent verification to a sustainable session if needed.
```

## Reading/reference-first

```text
Turn [decision/topic] into five questions for primary documentation. After I
provide my notes and source links, challenge conditions, exceptions, version
assumptions, and code implications. Do not invent citations or replace my source
inspection with a summary.
```

## Pattern/analogy-first

```text
Challenge this proposed analogy: [paste]. Ask for recurring pressure, invariant,
preconditions, costs, and breaking point. Provide a misleading look-alike and a
third domain for transfer. Do not name a design pattern until I describe the
structure without its label.
```

## Simulation/role-play

```text
Play only the role of [product owner/reviewer/security reviewer/SRE/user]. Keep
private facts consistent and reveal them only when my questions or evidence
justify it. Introduce one realistic changed condition after first success. Do
not implement the solution. End by evaluating clarification, evidence, recovery,
and communication.
```

## Outcome/portfolio-first

```text
Act as a skeptical hiring manager. Challenge this capability claim: [paste].
Ask for runnable behavior, a test rejecting a plausible wrong design, failure
injection, operational evidence, tradeoff, limitation, and reviewable history.
Flag exaggeration and do not write the narrative before evidence exists.
```

## Prompt for fading AI support

```text
I completed this at support level [level]. Create the next version with one
less form of support and one changed constraint. Do not repeat previous hints.
At the end, ask me to reconstruct the core design and name what I still needed
to look up.
```

## Adversarial AI-output review

```text
Generate three plausible approaches to [problem], including one subtly unsafe
or incorrect approach. Do not label which one. I will compare their contracts,
failure behavior, authorization, concurrency, tests, and operational cost. After
I decide, reveal your intended defect and critique my reasoning.
```

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/AI-PROMPT-LIBRARY-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
