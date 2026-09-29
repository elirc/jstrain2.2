# 04 — Strings, regex, collections, and dates mastery bank

Deepen: Unicode, parsing, formatting, regex safety, Map/Set semantics, UTC,
calendar rules, localization, and bounded input.

## Explain

- [ ] Explain code units, code points, grapheme clusters, and user-visible length.
- [ ] Compare regex validation, tokenization, and manual parsing with failure diagnostics.
- [ ] Explain regex anchoring, stateful flags, backtracking, and input limits.
- [ ] Explain Map/Set equality and insertion order versus plain object keys.
- [ ] Separate instant, timezone, local calendar date, duration, and formatted display.

## Predict

- [ ] Predict length/slicing for emoji, combining marks, surrogate pairs, and normalized text.
- [ ] Predict global/sticky regex `lastIndex` across repeated tests and failures.
- [ ] Predict ambiguous alternation and greedy/lazy matching on five strings.
- [ ] Predict Map/Set behavior for NaN, signed zero, objects, and equivalent strings.
- [ ] Predict UTC/local date arithmetic around midnight, month overflow, leap day, and DST.

## Implement

- [ ] Implement a bounded tokenizer with positions and useful invalid-token errors.
- [ ] Implement safe slug/tag normalization with explicit Unicode and collision policy.
- [ ] Implement multimap and counted bag operations using Map/Set.
- [ ] Implement strict duration parsing and canonical formatting without trailing junk.
- [ ] Implement UTC day bucketing and date-range overlap using half-open intervals.

## Test

- [ ] Build Unicode tests including normalization-equivalent and visually complex strings.
- [ ] Create a timed/adversarial test for a vulnerable regex, then replace or bound it.
- [ ] Test parser acceptance boundaries and failure positions, not only valid examples.
- [ ] Property-test Set algebra identities for union, intersection, and difference.
- [ ] Test date logic at leap years, end-of-month, timezone offsets, and DST transitions.

## Debug and review

- [ ] Diagnose state leakage from a reused global regex.
- [ ] Review a validator that accepts valid substrings because anchors are missing.
- [ ] Find unsafe truncation splitting visible characters or escape sequences.
- [ ] Diagnose duplicate tags caused by inconsistent normalization boundaries.
- [ ] Review local-time scheduling logic for repeated/skipped wall-clock times.

## Apply

- [ ] Define RelayDesk search normalization and document locale/collision limits.
- [ ] Bound and validate one user-controlled regex/search/filter input.
- [ ] Build UTC activity grouping with explicit display-time conversion.
- [ ] Review tags/labels storage for normalization, uniqueness, and presentation separation.
- [ ] Audit user text output for correct context handling rather than generic sanitization.

