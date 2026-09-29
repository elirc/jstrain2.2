# Collaborative review mode

Use this mode when questions, critique, accountability, and alternate designs
produce better reasoning. The collaborator may be a person or AI, but ownership
must remain visible.

## Roles

- **Driver:** edits and narrates the immediate decision.
- **Navigator:** tracks the contract, risks, and next test; does not dictate every line.
- **Reviewer:** reads the result from user and failure perspectives.
- **Incident lead:** coordinates evidence and recovery without guessing the fix.

Rotate driver/navigator every 20–30 minutes. Record who made and verified
important decisions.

## Sixty-minute session

1. Independently write a five-minute plan.
2. Compare plans and choose assumptions explicitly — 5 minutes.
3. Pair on one vertical outcome with role rotation — 30 minutes.
4. Review silently before discussing — 5 minutes.
5. Classify findings as defect, question, tradeoff, or style — 10 minutes.
6. Each person explains one decision independently — 5 minutes.

## Adapt a mastery exercise

Both participants predict independently. One implements while the other writes
counterexamples. Swap for the next task. For Explain exercises, one teaches and
the other must produce a novel example or counterexample. For reviews, authors
cannot explain intent until the reviewer has described observed behavior.

## Adapt a project increment

Use a lightweight PR:

- outcome and non-goals;
- contract/data changes;
- risks and alternatives;
- test and operational evidence;
- migration/rollout/rollback;
- questions for the reviewer.

The reviewer should trace at least one unauthorized actor, invalid input,
duplicate/concurrent action, dependency failure, and older-version interaction.

## AI role

AI can rotate among navigator, skeptical reviewer, product owner, security
reviewer, and incident commander. Tell it to ask questions before suggesting
code and to distinguish confirmed issues from possibilities. Independently
verify all cited behavior.

## Failure signals and correction

- **Partner takes over:** switch driver and require independent reconstruction.
- **Discussion without artifacts:** timebox debate and write a test or ADR.
- **Agreement mistaken for correctness:** request a counterexample and runtime proof.
- **Style-heavy review:** classify every comment and prioritize correctness/risk.
- **AI authority bias:** ask for alternatives, inspect sources, and record one
  suggestion you rejected or corrected.

## Exit evidence

Keep independent plans, role log, review comments with classifications, revised
tests/diff, and separate explanations from each participant.

<!-- spaced-pack-link:start -->
## Spaced practice

Use the [ten-stage day 0–90 practice pack](spaced-packs/08-COLLABORATIVE-REVIEW-SPACED-PACK.md) to retrieve, vary, and transfer this material instead of rereading it.
<!-- spaced-pack-link:end -->
