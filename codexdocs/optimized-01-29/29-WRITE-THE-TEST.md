# 29 — Write the test

## Outcome

Create independent evidence that distinguishes correct behavior from plausible
wrong behavior, especially at boundaries and under failure.

## The 80/20 model

Start from the contract and likely bug class, not the implementation. A strong
test fails on a realistic mutant, passes on correct alternatives, and produces
a diagnostic pointing toward behavior.

Examples cover known values; boundaries target transitions; properties state
relationships across many values; integration tests prove mechanisms that
fakes cannot. The correct mix depends on risk.

Code and tests generated from the same interpretation can agree on the wrong
contract. Write the first critical test independently, observe it fail for the
intended reason, and challenge it with a buggy implementation.

## Common traps

- Test written after code and never seen fail.
- Assertion duplicates implementation logic.
- Over-specifying order, calls, or private structure.
- Happy examples without empty/boundary/error/concurrency cases.
- Property generator never producing dangerous values.
- Flaky timing used as race evidence.

## Optimized exercises

1. **Mutants:** for sum, pagination, authorization, and retry, list three
   plausible bugs and write the smallest test that distinguishes each.
2. **Independent oracle:** let AI generate a bounded implementation and suite;
   identify their shared blind spot, add a failing test, and explain the missed
   contract.
3. **Application:** choose one RelayDesk feature and improve confidence by
   replacing a weak/duplicate test with a boundary-specific proof; show the
   buggy change it catches.

## Exit gate

Given a requirement and implementation, write a test that fails for a named
realistic defect, explain why its boundary is necessary, and demonstrate red
before green.

More reps: `../../bootcamp/29-write-the-test/`.

