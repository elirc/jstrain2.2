# 01 — Language core mastery bank

Deepen: value kinds, coercion, presence, equality, identity, numbers, dates,
copying, destructuring, and runtime boundary proof.

## Explain

- [ ] Explain binding, value, object identity, mutation, and rebinding with one diagram.
- [ ] Contrast `||`, `??`, default parameters, and destructuring defaults for five absent/falsy inputs.
- [ ] Explain `===`, `Object.is`, and deep equality, including `NaN`, signed zero, and objects.
- [ ] Explain why TypeScript types disappear and list five runtime trust boundaries.
- [ ] Explain floating-point representation and choose a money strategy with tradeoffs.

## Predict

- [ ] Predict 20 coercions across Boolean, Number, String, equality, and JSON before running them.
- [ ] Predict identities after assignment, spread, nested spread, array map, and structured clone.
- [ ] Predict destructuring results for missing, undefined, null, zero, and empty-string fields.
- [ ] Predict parsing for strict integer candidates including whitespace, prefixes, exponent, and unsafe range.
- [ ] Predict date results for invalid days, offsets, local text, DST boundaries, and invalid strings.

## Implement

- [ ] Implement strict finite integer parsing with min/max and structured errors.
- [ ] Implement a presence-aware patch mapper that distinguishes missing, null, empty, false, and zero.
- [ ] Implement an immutable nested update that clones only the changed spine.
- [ ] Implement currency addition/formatting using integer minor units and explicit rounding input.
- [ ] Implement strict UTC timestamp validation with canonical output and calendar validity.

## Test

- [ ] Create a boundary table that would fail under truthiness-based defaulting.
- [ ] Write identity assertions that catch shallow-copy mutation of nested ticket state.
- [ ] Build property tests for integer parser acceptance/rejection symmetry.
- [ ] Test JSON round trips for undefined, bigint, date, NaN, infinity, and custom objects.
- [ ] Write the test that distinguishes Date parseability from the required timestamp grammar.

## Debug and review

- [ ] Diagnose a zero-value overwritten by `||` without editing before reproduction.
- [ ] Review a spread-based clone and identify every shared nested identity.
- [ ] Find a permissive numeric parser accepting trailing junk and propose minimal correction.
- [ ] Diagnose a money-total drift and separate representation from formatting defects.
- [ ] Review a boundary cast and specify runtime evidence the assertion falsely claims.

## Apply

- [ ] Audit RelayDesk configuration parsing for coercion and missing-versus-falsy mistakes.
- [ ] Replace one unsafe request assertion with explicit parsing and useful field diagnostics.
- [ ] Trace object ownership through one React update and document preserved identities.
- [ ] Establish canonical timestamp rules across API, database, and UI with tests.
- [ ] Review one production-shaped diff for runtime assumptions invisible to TypeScript.

