# AI prompt library by learning mode — ten-stage spaced-practice pack

Source: [AI-PROMPT-LIBRARY.md](../AI-PROMPT-LIBRARY.md)

This pack expands the source into ten retrieval cycles from day 0 through day 90. Each cycle contains five actions: cold retrieval, reconstruction, discrimination/failure, transfer, and feedback/scheduling. Attempt before reopening the source.

## Scoring and interval rule

- **0 — no model:** no useful independent start; return tomorrow using a different representation and S2 support after attempting.
- **1 — fragile:** completes with substantial hints or cannot explain failure; repeat in one to two days at S1.
- **2 — familiar:** completes the known case independently but transfer fails; keep the next scheduled interval with a smaller changed constraint.
- **3 — transferable:** completes and explains a changed case independently; advance to the next interval.
- **4 — review-ready:** applies in unfamiliar work, detects misuse, and defends tradeoffs; advance and mix with another topic.

A minor syntax lookup may still score 3 when the mechanism and decisions are independent. Any conceptual hint caps the score at 2. Record accessibility support separately; access tools do not reduce the score.

## Stage 01 — Day 0: Baseline encoding

**Aim:** separate familiarity from what you can currently retrieve and produce. **Support:** S2 after the cold attempt.

- [ ] **Cold retrieval:** Without opening the source, explain **Universal tutor contract** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Build-first** from a blank page, file, diagram, test, or checklist; use a representative example.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Universal tutor contract** with **Example-first**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Build-first** in a representative example; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Universal tutor contract** and **Build-first**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 02 — Day 1: Blank reconstruction

**Aim:** reconstruct the core model before the first feeling of fluency fades. **Support:** S2 fading to S1.

- [ ] **Cold retrieval:** Without opening the source, explain **Build-first** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Example-first** from a blank page, file, diagram, test, or checklist; use the same mechanism from a blank artifact.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Build-first** with **Visual modeling**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Example-first** in the same mechanism from a blank artifact; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Build-first** and **Example-first**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 03 — Day 3: Discrimination

**Aim:** choose the correct mechanism from competing plausible options. **Support:** S1.

- [ ] **Cold retrieval:** Without opening the source, explain **Example-first** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Visual modeling** from a blank page, file, diagram, test, or checklist; use a misleading adjacent concept or look-alike.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Example-first** with **Verbal teach-back**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Visual modeling** in a misleading adjacent concept or look-alike; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Example-first** and **Visual modeling**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 04 — Day 7: Interleaved application

**Aim:** retrieve the skill without the source file or topic heading acting as a cue. **Support:** S1.

- [ ] **Cold retrieval:** Without opening the source, explain **Visual modeling** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Verbal teach-back** from a blank page, file, diagram, test, or checklist; use an unlabeled task mixed with another topic.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Visual modeling** with **Challenge/debug-first**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Verbal teach-back** in an unlabeled task mixed with another topic; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Visual modeling** and **Verbal teach-back**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 05 — Day 14: Feedback correction

**Aim:** repair the mental model and prove that feedback changed future behavior. **Support:** S1.

- [ ] **Cold retrieval:** Without opening the source, explain **Verbal teach-back** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Challenge/debug-first** from a blank page, file, diagram, test, or checklist; use a previous misconception or weak artifact.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Verbal teach-back** with **Structured guided**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Challenge/debug-first** in a previous misconception or weak artifact; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Verbal teach-back** and **Challenge/debug-first**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 06 — Day 21: Teach-back and objection

**Aim:** communicate causal reasoning and defend a tradeoff without notes. **Support:** S1 then S0.

- [ ] **Cold retrieval:** Without opening the source, explain **Challenge/debug-first** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Structured guided** from a blank page, file, diagram, test, or checklist; use an adversarial reviewer question.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Challenge/debug-first** with **Collaborative review**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Structured guided** in an adversarial reviewer question; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Challenge/debug-first** and **Structured guided**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 07 — Day 30: Project transfer

**Aim:** apply the method under authentic state, data, user, and failure constraints. **Support:** S0.

- [ ] **Cold retrieval:** Without opening the source, explain **Structured guided** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Collaborative review** from a blank page, file, diagram, test, or checklist; use a real RelayDesk or CRUD-project ticket.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Structured guided** with **Adaptive energy/accessibility**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Collaborative review** in a real RelayDesk or CRUD-project ticket; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Structured guided** and **Collaborative review**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 08 — Day 45: Review and debugging

**Aim:** recognize absence or misuse of the skill in code you did not just write. **Support:** S0.

- [ ] **Cold retrieval:** Without opening the source, explain **Collaborative review** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Adaptive energy/accessibility** from a blank page, file, diagram, test, or checklist; use unfamiliar or subtly defective work.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Collaborative review** with **Reading/reference-first**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Adaptive energy/accessibility** in unfamiliar or subtly defective work; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Collaborative review** and **Adaptive energy/accessibility**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 09 — Day 60: Requirement and incident change

**Aim:** preserve the capability when the original plan and happy path no longer hold. **Support:** S0.

- [ ] **Cold retrieval:** Without opening the source, explain **Adaptive energy/accessibility** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Reading/reference-first** from a blank page, file, diagram, test, or checklist; use a changed requirement plus dependency or operational failure.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Adaptive energy/accessibility** with **Universal tutor contract**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Reading/reference-first** in a changed requirement plus dependency or operational failure; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Adaptive energy/accessibility** and **Reading/reference-first**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Stage 10 — Day 90: Independent mastery audit

**Aim:** demonstrate durable, flexible performance and decide the next review interval. **Support:** S0.

- [ ] **Cold retrieval:** Without opening the source, explain **Reading/reference-first** and state the problem it solves, its mechanism, one boundary, and one counterexample.
  - Proof: preserve the first attempt, mark uncertainty, then correct it in different words after checking the source. Do not count rereading as retrieval.
- [ ] **Reconstruct:** Create the source's useful artifact for **Universal tutor contract** from a blank page, file, diagram, test, or checklist; use a novel context selected at random.
  - Proof: compare with the source only after completion and record the smallest missing decision, not a copied paragraph.
- [ ] **Discriminate and break:** Contrast **Reading/reference-first** with **Build-first**, then construct a failure, misuse, or misleading look-alike that reveals when the first approach is insufficient.
  - Proof: provide an executable counterexample, decision table, trace, or review comment that distinguishes the two.
- [ ] **Transfer:** Use **Universal tutor contract** in a novel context selected at random; change at least one of ownership, timing, trust, data size, failure, concurrency, or version compatibility.
  - Proof: produce a reviewable artifact and explain which part transferred, which did not, and why.
- [ ] **Feedback and schedule:** Obtain runtime, test, primary-source, human-review, or adversarial-AI feedback on **Reading/reference-first** and **Universal tutor contract**. Score the attempt 0–4 and schedule the next interval.
  - Proof: record evidence, one corrected misconception, assistance used, and the next retrieval date. AI may question or review, but must not replace the cold attempt.

### Stage record

```text
Date / actual gap since last attempt:
Score 0–4 and reason:
Cold misconception or hesitation:
Evidence produced:
Changed dimension:
AI/human/accessibility support used:
Next date and task:
```

## Completion gate

Complete the pack when the day-90 audit scores at least 3, includes unfamiliar project or review evidence, and can be explained without the source or AI. Otherwise schedule a focused lapse repair rather than restarting all ten stages.
