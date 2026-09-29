# 01 — Language core

## Outcome

Predict how values behave at runtime and make coercion, absence, copying, and
numeric edge cases explicit at system boundaries.

## The 80/20 model

JavaScript variables bind to values. Primitives are copied as values; objects
are accessed by identity. Spread creates a shallow outer copy. `const` prevents
rebinding, not object mutation.

Use `===` for ordinary equality and `Object.is` when `NaN` or signed zero
matters. Use `??` for missing values; `||` also replaces valid falsy values such
as `0`, `false`, and `''`. Treat conversions as parsing decisions rather than
convenient one-liners.

Numbers are IEEE-754 floating point. Money generally needs integer minor units
or a deliberate decimal strategy. Dates are instants plus interpretation;
invalid calendar text can normalize unexpectedly, so parsing requirements must
be stricter than “Date accepted it.”

## Common traps

- Mistaking `typeof null === 'object'` for useful validation.
- Using truthiness to test field presence.
- Expecting spread to clone nested state.
- Accepting `parseInt('12px')` at a strict boundary.
- Comparing floating-point money directly.
- Assuming a TypeScript annotation changes runtime input.

## Optimized exercises

1. **Prediction:** build a table for `undefined`, `null`, `false`, `0`, `''`,
   `NaN`, empty array, and empty object under Boolean, `||`, `??`, `Number`,
   equality, and JSON serialization. Predict first.
2. **Implementation:** write `parsePositiveInt(value: unknown, max: number)`
   without permissive prefixes, whitespace surprises, floats, or unsafe
   integers. Return structured failure.
3. **Application:** audit one RelayDesk request parser for absence, coercion,
   numeric, date, and shallow-copy assumptions. Add the most valuable missing
   test.

## Exit gate

Explain why `count || 10`, `{ ...ticket }`, `Number.isNaN(value)`, and
`new Date(text)` can each look reasonable while violating a boundary contract.

More reps: `../../bootcamp/01-language-core/`.

