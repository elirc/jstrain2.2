# Verbal teach-back mode

Use this mode when implementation outpaces understanding, interviews expose
gaps, or speaking forces clearer reasoning than private notes. Speech is a
diagnostic tool; correctness still requires executable evidence.

## Explanation frames

### Mechanism frame

1. What problem exists?
2. What mechanism addresses it?
3. Who owns it?
4. What happens on success?
5. What happens on failure, repetition, and concurrency?
6. What alternative did we reject?

### Code-review frame

1. What observable contract changes?
2. Which invariant is protected or threatened?
3. What evidence supports the change?
4. Which case is missing?
5. Is this a defect, question, tradeoff, or style preference?

### Incident frame

1. What did users observe?
2. What facts do we have?
3. Which hypothesis does each fact support or reject?
4. Where was the first contract violation?
5. Why does the fix address cause rather than symptom?

## Sixty-minute session

1. Two-minute cold explanation — 5 minutes including notes.
2. Implement, test, or inspect the behavior — 25 minutes.
3. Correct the explanation from evidence — 10 minutes.
4. Answer five adversarial follow-ups — 10 minutes.
5. Record a final three-minute explanation — 5 minutes.
6. List one uncertain statement to verify — 5 minutes.

## Adapt a mastery exercise

For every task, speak before and after. In Explain, prohibit code for the first
pass. In Predict, narrate the trace before execution. In Implement/Test, explain
the contract and suspected defect before typing. In Debug/Apply, present the
evidence as if requesting PR approval.

## Adapt a project increment

Record a five-minute demo for four audiences:

- user: outcome and recovery;
- engineer: boundaries and invariants;
- reviewer: alternatives and test evidence;
- operator: detection, retry, rollback, and recovery.

If the four explanations sound identical, audience concerns are probably missing.

## AI role

Use voice or text as an interviewer. Require one question at a time, no answer
until you commit, and follow-ups targeting vague phrases. Ask AI to flag claims
that need runtime or source verification. Correct its premise when necessary.

## Failure signals and correction

- **Fluent but vague:** ban “handles,” “manages,” and “works” unless you name the mechanism.
- **Long monologue:** use one causal chain and one counterexample.
- **Correct speech, weak code:** switch the central session to Build-first.
- **Memorized answer:** change one constraint and explain again.
- **AI completes your thought:** restart with AI limited to questions.

## Exit evidence

Keep before/after recordings or transcripts, the evidence that changed your
explanation, five follow-up answers, and a delayed no-notes explanation.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/05-VERBAL-TEACH-BACK-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
