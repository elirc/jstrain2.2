# Mode selector

Choose a mode for the current barrier, not for your identity. Reassess weekly
and after two unproductive sessions.

## Step 1 — identify the barrier

Select the statement that best describes what prevents useful practice today.

| Current barrier | Start with |
| --- | --- |
| “I understand while reading, then cannot build.” | Build-first |
| “I cannot see how the pieces fit or where to begin.” | Example-first |
| “I lose track of state, sequence, ownership, or boundaries.” | Visual modeling |
| “My code works, but I cannot explain why or defend choices.” | Verbal teach-back |
| “Normal lessons are boring; failures and puzzles hold attention.” | Challenge/debug-first |
| “Large open-ended tasks overwhelm me.” | Structured guided |
| “I learn more when someone questions my reasoning.” | Collaborative review |
| “My capacity changes sharply by day or environment.” | Adaptive energy/accessibility |
| “I need precise written rules before trusting my model.” | Reading/reference-first |
| “I understand a new idea by comparing it with known cases.” | Pattern/analogy-first |
| “A realistic job scenario makes abstract work meaningful.” | Simulation/role-play |
| “A visible portfolio outcome is what keeps me moving.” | Outcome/portfolio-first |

If two fit, choose the one that helps you **start**, then use the other for the
session's explanation or review phase.

## Step 2 — calibrate prior knowledge

Take one representative task cold for 15 minutes.

- **0 — no useful start:** use a worked example, label its decisions, then
  complete a near-copy with one section missing.
- **1 — partial model:** use a faded example or structured checklist, then solve
  a near-transfer problem.
- **2 — completes familiar case:** start with a novel variation or bug hunt and
  require a written prediction.
- **3 — completes and explains:** skip routine practice; apply it within a
  project constraint, review, performance investigation, or incident.

Do not infer competence from familiarity. The cold task must produce an
observable outcome or explanation without opening the coaching notes.

## Step 3 — choose representation and response

Representation options:

- concise prose and definitions;
- annotated code or worked example;
- data-flow, state-machine, sequence, memory, or entity diagram;
- narrated trace or discussion;
- executable test and observed runtime behavior;
- realistic ticket or incident.

Response options:

- working code and tests;
- prediction/observation table;
- diagram with narrated causal path;
- code review or incident report;
- written explanation or short recording;
- pair-programming session with a driver/navigator log.

The final response must match the professional capability. An API-design topic
eventually needs an API contract and tests; a verbal explanation alone is not
enough. Accessibility changes how you access and express the work, not whether
you can perform the engineering behavior.

## Step 4 — select support level

| Level | Support | Exit condition |
| --- | --- | --- |
| S3 — modeled | Complete worked example and narrated decisions | Explain each decision and alter one constraint |
| S2 — faded | Partial implementation, outline, or hints | Fill gaps and pass near-transfer test |
| S1 — prompted | Contract, acceptance cases, and questions only | Implement and defend independently |
| S0 — independent | Ticket or incident only | Produce evidence with no procedural hints |

Move down one support level after two successful attempts. Move up one after
two attempts that fail for missing prerequisite knowledge, not merely because
the problem is uncomfortable.

## Step 5 — use switching evidence

Stay with the mode when you are producing correct work, useful explanations,
and delayed recall. Switch when two sessions show the same failure pattern:

- consuming without producing → Build-first or Challenge/debug-first;
- producing without understanding → Example-first or Verbal teach-back;
- losing the system model → Visual modeling;
- failing to start or sequence work → Structured guided;
- missing review objections → Collaborative review;
- capacity mismatch → Adaptive energy/accessibility.
- uncertain protocol/library guarantee → Reading/reference-first;
- duplicated solutions without a clear abstraction → Pattern/analogy-first;
- weak requirements/team/incident behavior → Simulation/role-play;
- activity without a credible professional outcome → Outcome/portfolio-first.

## Five-minute weekly check

Record:

1. What could I reproduce after 48 hours?
2. What could I apply with one important detail changed?
3. Which error repeated?
4. Which mode produced the strongest evidence per hour?
5. What mode and support level will I use next week, and why?

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/00-MODE-SELECTOR-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
