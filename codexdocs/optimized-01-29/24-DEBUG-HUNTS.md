# 24 — Debug hunts

## Outcome

Diagnose plausible single-file defects by separating observations from
hypotheses and making the smallest evidence-backed correction.

## The 80/20 model

Start with the contract and observed symptom. Reproduce reliably, reduce the
surface, and generate competing hypotheses. A useful experiment causes
different predicted results under different hypotheses.

Trace the first incorrect state backward rather than editing the final crash
site automatically. Name likely bug classes: boundary, identity/mutation,
ordering, stale closure, missing await, error swallowing, cache key, off-by-one,
date/unit, join cardinality, and race.

Fix minimally first. Add a regression test at the boundary that should have
caught the defect. Refactor separately so diagnosis and behavior change remain
visible.

## Common traps

- Editing before reproducing.
- Treating stack-trace top as root cause.
- Random changes or broad rewrites.
- Only one favored hypothesis.
- Test added after fix but never observed red.
- Fixing symptom while invariant remains broken.

## Optimized exercises

1. **Diagnosis:** choose an unseen hunt; write contract, observation, three
   hypotheses, and discriminating experiment before editing.
2. **Minimal fix:** correct the defect in one small commit, add regression test
   in another, then explain why existing tests missed it.
3. **Application:** ask AI to inject one bounded RelayDesk defect on a temporary
   branch without revealing it; diagnose at AI Level 0 and discard safely.

## Exit gate

Demonstrate a bug investigation timeline where evidence eliminates at least
one plausible hypothesis before the final fix.

More reps: `../../bootcamp/24-debug-hunts/`.

