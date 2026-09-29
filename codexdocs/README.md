# RelayDesk Engineering Course

This is the project-based TypeScript + Node + React course for this repository.
It keeps the best existing drills, but changes the center of gravity from
"finish hundreds of isolated exercises" to "own one evolving system."

The target is not a title after a fixed number of hours. The target is
observable mid-level behavior: clarify an incomplete request, change code
across layers, protect contracts with tests, review a risky diff, deploy it,
and diagnose it when it fails.

## The course at a glance

- **Standard pace:** 12 weeks, 12–18 focused hours per week.
- **Intensive pace:** 6 weeks, 25–35 focused hours per week; combine two
  adjacent weeks but do not remove their exit gates.
- **Primary stack:** strict TypeScript, Node, React, SQL, and HTTP.
- **Main project:** RelayDesk, a multi-user support-ticket system.
- **Exercise volume:** 1,057 exercises/tickets: 40 project tickets, 60 deep
  concept-to-application exercises, 87 optimized 01–29 core exercises, and
  870 topic-specific mastery exercises.
- **Time split:** 70% project work, 20% targeted drills, 10% review and
  explanation.
- **Core rule:** progress is measured by evidence, not files completed.

## Start here

1. Read [COURSE-MAP.md](COURSE-MAP.md).
2. Complete [00-DIAGNOSTIC.md](00-DIAGNOSTIC.md) without solution files.
3. Use your score to select the warm-up work in
   [01-FOUNDATIONS-SPRINT.md](01-FOUNDATIONS-SPRINT.md).
4. Read [02-PROJECT-BRIEF.md](02-PROJECT-BRIEF.md), create the application,
   and execute [03-BACKLOG.md](03-BACKLOG.md) in order.
5. Use the test, AI, team, and assessment rules in this folder throughout.

## Course documents

| Document | Purpose |
| --- | --- |
| [COURSE-MAP.md](COURSE-MAP.md) | Twelve-week sequence, weekly rhythm, and gates |
| [00-DIAGNOSTIC.md](00-DIAGNOSTIC.md) | A cold baseline that selects your prerequisites |
| [01-FOUNDATIONS-SPRINT.md](01-FOUNDATIONS-SPRINT.md) | A short, selective bridge into project work |
| [02-PROJECT-BRIEF.md](02-PROJECT-BRIEF.md) | Product, architecture, domain, API, and UI brief |
| [APP-SETUP.md](APP-SETUP.md) | Reproducible workspace setup playbook |
| [03-BACKLOG.md](03-BACKLOG.md) | Forty realistic tickets grouped into twelve increments |
| [modules/](modules/) | Ten deep modules containing sixty applied exercises |
| [EXERCISE-INDEX.md](EXERCISE-INDEX.md) | Searchable index of all expanded module exercises |
| [WORKED-EXAMPLES.md](WORKED-EXAMPLES.md) | Ten cross-layer reasoning walkthroughs |
| [optimized-01-29/](optimized-01-29/) | Lessons, 30-task mastery banks, and four-part coaching for every problem |
| [crud-projects/](crud-projects/) | Eight CRUD briefs plus intent/evidence explanations for every requirement |
| [learning-modes/](learning-modes/) | Twelve adaptive modes plus 24 ten-stage spaced packs containing 1,200 practice actions |
| [spaced-repetition-all/](spaced-repetition-all/) | Ten-stage day 0–90 packs for all 194 course files: 9,700 practice actions |
| [04-TEST-STRATEGY.md](04-TEST-STRATEGY.md) | Test pyramid, contracts, fixtures, and quality gates |
| [05-AI-PROTOCOL.md](05-AI-PROTOCOL.md) | How to use AI intensely without outsourcing judgment |
| [06-ENGINEERING-RUBRIC.md](06-ENGINEERING-RUBRIC.md) | Capability-based scoring and graduation bar |
| [07-TEAM-SIMULATION.md](07-TEAM-SIMULATION.md) | PR review, incidents, ambiguity, and maintenance practice |
| [08-INTERVIEW-READINESS.md](08-INTERVIEW-READINESS.md) | Portfolio, verbal, coding, debugging, and design preparation |
| [PROGRESS.md](PROGRESS.md) | Gates, increment status, scores, and evidence index |
| [references/EXISTING-MATERIAL-MAP.md](references/EXISTING-MATERIAL-MAP.md) | The best existing modules, routed by need |
| [templates/](templates/) | Working templates for PRs, ADRs, incidents, logs, and retros |

## Non-negotiable operating rules

1. Never spend more than 30% of a week on drills.
2. Never copy a reference solution into the project.
3. Every project ticket ends with a commit, tests, and a short explanation.
4. Every week includes one unfamiliar-code debugging session.
5. Every two weeks includes a deployable release.
6. AI may propose; you decide, test, and explain.
7. If you cannot explain a line, it is not ready to merge.

## What this course deliberately does not do

- It does not require completing the JavaScript, TypeScript, React, and C#
  libraries end to end.
- It does not prioritize clever type puzzles or hard algorithms over product
  work.
- It does not prescribe package versions that will become stale. Choose
  maintained versions during setup, commit the lockfile, and record important
  choices in an ADR.
- It does not promise that study alone substitutes for time on a real team.
  Instead, it makes the solo work resemble team work as closely as possible.

## Definition of success

At the end, another engineer should be able to clone your RelayDesk project,
run one documented setup command, execute all checks, understand the major
decisions, and review a deployed application. You should be able to add a
feature, investigate a failure, and defend the tradeoffs without asking AI to
explain your own code back to you.
