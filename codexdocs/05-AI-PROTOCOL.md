# AI-assisted engineering protocol

The objective is to use AI for leverage while keeping requirements,
verification, and judgment in your hands.

## The control loop

For every non-trivial ticket:

1. **Frame:** write the outcome, constraints, non-goals, and edge cases.
2. **Map:** identify affected layers and read the relevant code yourself.
3. **Predict:** name likely failure classes before implementation.
4. **Prove:** write or identify the first critical test.
5. **Build:** implement in small changes, using AI at an intentional level.
6. **Inspect:** read the final diff line by line.
7. **Attack:** test boundaries, concurrency, security, and operations.
8. **Explain:** describe why it works without quoting the AI.

If you skip framing or proof, AI makes you faster at building the wrong thing.

## Four assistance levels

Record the highest level used for each ticket.

### Level 0 — no AI

Use for the diagnostic, one weekly feature, one weekly debugging session, and
the final architecture defense.

### Level 1 — Socratic coach

AI may ask questions, explain an error, name relevant concepts, or suggest an
experiment. It may not provide implementation code.

Example prompt:

```text
Act as a Socratic senior engineer. Do not provide code. Ask one question at a
time that helps me diagnose why this request can show stale data. Require an
observation before accepting a hypothesis.
```

### Level 2 — reviewer and designer

AI may review your plan or diff, identify risks, compare options, and propose
test cases. You still write the implementation.

Example prompt:

```text
Review this ticket, contract, and diff for correctness, authorization,
concurrency, operability, and missing tests. Separate confirmed defects from
questions and preferences. Cite the exact line and give a reproduction for
every claimed defect. Do not rewrite the code.
```

### Level 3 — implementation assistant

AI may implement a bounded subtask after you define its contract and test
oracle. Use for boilerplate, repetitive mappings, mechanical migrations, and
well-understood code.

Before accepting Level 3 work:

- state why the task is safe to delegate;
- inspect every changed line;
- run independent tests;
- remove abstractions you cannot justify;
- explain the result from memory.

## Never delegate completely

- Product and edge-case decisions.
- Authorization policy.
- The first critical test for a requirement.
- Data-loss or migration decisions.
- Security acceptance.
- Incident severity and mitigation choice.
- Final code-review judgment.
- Your understanding.

AI can participate in all of these, but cannot be the only decision-maker or
oracle.

## Prompt packet

Give AI a reviewable packet instead of a vague request:

```text
Outcome:
Current behavior/evidence:
Required behavior:
Constraints:
Non-goals:
Affected interfaces:
Known edge cases:
Tests I will use as the oracle:
What I want from you:
What you must not do:
```

Writing this packet is requirements practice. If you cannot fill it in, the
ticket is not ready for code generation.

## Generated-code review sequence

1. Check scope: did it change only requested areas?
2. Check contracts: inputs, outputs, errors, side effects, and ownership.
3. Trace one normal and one hostile value through every boundary.
4. Check failure behavior: partial writes, retries, cleanup, and logs.
5. Check concurrency: ordering, stale responses, lost updates, duplicates.
6. Check security: validation, authorization, escaping, secrets, dependency
   use.
7. Check operations: timeouts, limits, diagnostics, shutdown, configuration.
8. Run the existing tests, then add your independent counterexample.

## Verification ladder

Use the cheapest trustworthy oracle available:

1. Types and static checks.
2. Focused deterministic test.
3. Package test suite.
4. Integration test against the real boundary.
5. Full repository checks.
6. Manual or browser verification.
7. Deployed smoke check and logs.

Passing one rung does not imply the next. TypeScript cannot prove JSON is
valid; a unit fake cannot prove SQL rollback; a green E2E test cannot explain
which layer is correct.

## Learning ledger

For each ticket, record:

- assistance level;
- what AI contributed;
- one suggestion accepted and why;
- one suggestion rejected or changed and why;
- independent verification performed;
- what you can now reproduce without AI.

Use `templates/LEARNING-LOG.md`. If every entry says all suggestions were
accepted, your review is probably ceremonial.

## Weekly AI drills

### Adversarial review

Ask AI to find five defects in a diff. Verify each. Score false positives as a
cost; confident noise is part of the exercise.

### Competing designs

Ask for two materially different designs and failure modes, then write your
own decision. Do not ask which is “best” without project constraints.

### Generated bug

Ask AI to introduce one realistic bug into a temporary branch without naming
the location. Diagnose it from a failing test or symptom. Discard the branch
after documenting the bug class.

### Explain-back

Have AI interview you about the week's code. It should challenge vague words
such as “handles,” “secure,” “scalable,” and “optimized.”

## Warning signs

- You ask AI before reading the error or surrounding code.
- Code arrives before the contract exists.
- The same response supplies implementation and the only tests.
- You accept a dependency or architecture because AI called it standard.
- Your prompts contain “fix it” but no required behavior.
- You cannot predict which test should fail before running it.
- You need AI to explain your diff during review.

When a warning sign appears, drop one assistance level for the next task.

