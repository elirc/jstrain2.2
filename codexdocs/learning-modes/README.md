# Adaptive learning modes

This layer makes the TypeScript, Node, React, SQL, debugging, and project
material usable through several study modes. It does **not** assign a permanent
visual, auditory, or kinesthetic identity. Research does not justify matching
instruction to a fixed modality label as a general way to improve learning.
Preferences are real, but the useful question is: **which mode removes today's
barrier while preserving retrieval, feedback, transfer, and real performance?**

Use [the mode selector](00-MODE-SELECTOR.md) at the start of a week or whenever
progress stalls. Keep [the common learning loop](01-COMMON-LEARNING-LOOP.md)
regardless of the selected mode.

## Ten-stage expansion

Every file in this adaptive layer has a dedicated
[day 0–90 spaced-practice pack](spaced-packs/README.md). Each pack contains ten
retrieval stages and fifty concrete actions: cold recall, reconstruction,
discrimination/failure, changed-context transfer, and feedback/scheduling.
Across 24 sources, that is 240 sessions and 1,200 actions. Do not perform the
ten stages consecutively; the retrieval gap is part of the training.

For the larger expansion covering every lesson, mastery bank, explanation,
module, CRUD brief, template, course guide, and existing practice pack, use the
[whole-course spaced-repetition index](../spaced-repetition-all/README.md). It
adds 1,940 sessions and 9,700 practice actions across 194 source files.

## Mode index

| Mode | Begin here when | Main danger |
| --- | --- | --- |
| [Build-first](02-BUILD-FIRST.md) | Reading feels inert; a concrete outcome creates motivation | Trial-and-error without a model |
| [Example-first](03-EXAMPLE-FIRST.md) | The problem has too many unfamiliar moving parts | Copying instead of fading support |
| [Visual modeling](04-VISUAL-MODELING.md) | State, time, ownership, or data flow is hard to hold mentally | Decorative diagrams without predictions |
| [Verbal teach-back](05-VERBAL-TEACH-BACK.md) | You can make code work but cannot explain it | Fluent speech masking missing evidence |
| [Challenge/debug-first](06-CHALLENGE-DEBUG-FIRST.md) | Puzzles, incidents, and broken systems sustain attention | Random guessing or puzzle-only skill |
| [Structured guided](07-STRUCTURED-GUIDED.md) | Ambiguity or executive load prevents starting | Checklist completion without transfer |
| [Collaborative review](08-COLLABORATIVE-REVIEW.md) | Dialogue, critique, and accountability improve follow-through | Letting a partner or AI own the reasoning |
| [Adaptive energy/accessibility](09-ADAPTIVE-ENERGY-ACCESSIBILITY.md) | Attention, fatigue, disability, environment, or stress varies | Permanently lowering the capability target |
| [Reading/reference-first](10-READING-REFERENCE-FIRST.md) | Precise source material stabilizes an unfamiliar contract | Passive consumption and source collecting |
| [Pattern/analogy-first](11-PATTERN-ANALOGY-FIRST.md) | Comparing cases reveals reusable engineering structure | Reusing surface resemblance beyond its limits |
| [Simulation/role-play](12-SIMULATION-ROLEPLAY.md) | Realistic stakeholders, review, or incidents create meaning | Discussion without executable evidence |
| [Outcome/portfolio-first](13-OUTCOME-PORTFOLIO-FIRST.md) | A concrete professional claim sustains motivation | Polished claims unsupported by system quality |

You may combine modes. A strong default sequence is example-first for the first
unfamiliar mechanism, visual modeling for a cross-layer flow, build-first for
the feature, verbal teach-back for review, and challenge/debug-first for delayed
retrieval.

## What never changes

Every mode must eventually produce:

- an attempt made before seeing the complete answer;
- feedback against tests, behavior, a review, or a trusted reference;
- an explanation of the mechanism and failure modes;
- transfer into unfamiliar code or a real project;
- delayed retrieval without the original cues;
- inspectable evidence recorded in [PROGRESS.md](PROGRESS.md).

Changing the representation is allowed. Removing the required capability is
not. For example, you may learn concurrency with a timeline, narration, a race
test, or a guided example, but you must eventually diagnose and prevent a race
without depending on the learning scaffold.

## Research basis

This design uses flexible means of engagement, representation, and expression,
consistent with [CAST's Universal Design for Learning Guidelines 3.0](https://udlguidelines.cast.org/).
It treats learner variability and accessibility as design inputs rather than
fixed categories. It also retains practice testing and distributed practice,
which were rated high-utility techniques in the
[Dunlosky et al. review](https://www.psychologicalscience.org/publications/journals/pspi/learning-techniques.html),
and delayed retrieval, supported by
[Roediger and Karpicke's test-enhanced learning experiments](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x).

Worked examples are used as temporary scaffolding for unfamiliar material,
then faded into completion and independent problems. Programming research has
also examined worked examples with metacognitive scaffolding; see
[Shin et al.](https://journals.sagepub.com/doi/10.1177/07356331231174454).
The course avoids fixed-style matching because reviews have found insufficient
or too-small/inconsistent evidence to justify it as a broad instructional
policy; see [Pashler et al.](https://journals.sagepub.com/doi/10.1111/j.1539-6053.2009.01038.x)
and the [2024 meta-analysis](https://pubmed.ncbi.nlm.nih.gov/39055994/).

## Integration points

- Convert any 01–29 exercise with [ADAPTATION-RECIPES.md](ADAPTATION-RECIPES.md).
- Route each topic with [TOPIC-MODE-MATRIX.md](TOPIC-MODE-MATRIX.md).
- Route project phases with [CRUD-PROJECT-MODE-MATRIX.md](CRUD-PROJECT-MODE-MATRIX.md).
- Choose a weekly cadence in [WEEKLY-PLANS.md](WEEKLY-PLANS.md).
- Copy a bounded format from [SESSION-CARDS.md](SESSION-CARDS.md).
- Adapt the large projects without weakening their gates using
  [PROJECT-ADAPTATIONS.md](PROJECT-ADAPTATIONS.md).
- Use AI deliberately with [AI-PROMPT-LIBRARY.md](AI-PROMPT-LIBRARY.md).
- Schedule durable practice with [RETENTION-SYSTEM.md](RETENTION-SYSTEM.md).
- Run the full ten-stage expansion from [spaced-packs/README.md](spaced-packs/README.md).
- Track mode effectiveness and switching evidence in [PROGRESS.md](PROGRESS.md).
- Use the existing [AI protocol](../05-AI-PROTOCOL.md) in every mode.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/README-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
