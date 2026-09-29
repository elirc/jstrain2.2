# Reading and reference-first mode

Use this mode when precise written material helps you form a stable model before
touching code. It is especially useful for language semantics, HTTP standards,
library contracts, SQL behavior, security rules, and unfamiliar codebases.
Reading becomes learning only when it changes a prediction or artifact.

## Three-pass reading method

### Pass 1 — question map

Before reading, write three to seven questions the source must answer. Include:

- one mechanism question;
- one boundary or exception;
- one failure behavior;
- one decision you expect to make in code;
- one claim that requires primary-source verification.

Skim headings and examples only long enough to locate relevant sections.

### Pass 2 — claim and evidence

Read closely and capture compact claim cards:

```text
Claim:
Condition where true:
Counterexample or limitation:
Source section/link:
Code decision affected:
```

Do not copy paragraphs. If you cannot compress the claim, identify the missing
term or prerequisite instead of rereading the whole source.

### Pass 3 — close and produce

Close the source. Answer the original questions, write a small example or test,
and identify one place the rule does not apply. Reopen only to correct exact
details, then restate the correction without looking.

## Sixty-minute session

1. Questions and cold answers — 10 minutes.
2. Targeted primary-source reading — 15 minutes.
3. Closed-source retrieval — 10 minutes.
4. Executable example or project decision — 15 minutes.
5. Counterexample and source citation — 5 minutes.
6. Schedule delayed recall — 5 minutes.

## Adapt a mastery exercise

Use the optimized lesson to identify vocabulary, then read only the primary
documentation needed for the task. Convert the exercise into one claim card,
one runnable demonstration, and one changed-condition test. For Node and React
APIs, distinguish runtime guarantees from framework convention. For SQL and
HTTP, distinguish standard semantics from a specific implementation.

## Adapt a project increment

Create a short decision note before adopting an unfamiliar API or behavior:

- requirement and risk;
- authoritative source;
- guarantee versus assumption;
- minimal experiment;
- chosen design and alternative;
- version or environment constraints.

Attach the note to an ADR only when the decision has meaningful future cost.

## AI role

AI may help generate questions, locate terminology, compare your summary to a
source, and quiz you. Require direct links for factual claims and inspect the
source yourself. Do not let an AI summary replace version-specific documentation.

## Failure signals and correction

- **Highlighting without production:** close the source and write the example.
- **Reading entire manuals:** return to the current decision and bounded questions.
- **Source accumulation:** keep only material that changes code or a prediction.
- **Documentation treated as infallible:** run the minimal version-specific experiment.
- **Strong recall, weak delivery:** switch the center of the next session to Build-first.

## Exit evidence

Keep question map, claim cards, source links, executable example, corrected
misconception, project decision, and delayed closed-source explanation.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/10-READING-REFERENCE-FIRST-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
