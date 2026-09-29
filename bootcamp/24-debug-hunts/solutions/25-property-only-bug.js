// ─────────────────────────────────────────────────────────────────────────
//  25 · the bug only a property can see — SOLUTION          ★★★ stretch
//  concepts: property testing · rounding · invariants
//  run: node 25-property-only-bug.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Bug class: a rounding step that breaks a conservation law — money
//  created or destroyed by `Math.round`. `base = Math.round(total /
//  parts)` rounds UP whenever the fraction is at least a half, so
//  `base * parts` overshoots the total and `remainder` comes out
//  NEGATIVE. The loop `for (let i = 0; i < remainder; i++)` simply
//  never runs, nobody notices, and the function returns `parts` shares
//  that add up to more than it was given. 32 split 9 ways became
//  9 × 4 = 36.
//  The minimal fix is one word:
//      const base = Math.floor(totalCents / parts);
//  Floor guarantees `0 <= remainder < parts`, so the loop distributes
//  exactly the leftover cents, one each, to the first `remainder`
//  people — both invariants hold by construction.
//  The tell: a `remainder` derived from a ROUNDED quantity, and a loop
//  bound that assumes it is non-negative. Any time you round in the
//  middle of a calculation whose total is fixed, ask what happens to
//  the difference. Round at the edges, distribute in the middle.
//  Why the example tests could not see it: every one of them uses an
//  input where the division rounds down or divides evenly — 100/4,
//  100/3, 60/3, 999/1. They were written by the same person, at the
//  same time, with the same picture in their head as the code. That is
//  the structural weakness of example tests: they inherit the author's
//  assumptions, so they can only catch mistakes the author did not
//  make.
//  Why the property could: it does not describe outputs, it describes
//  a RELATION that must hold for every input — "the shares sum to the
//  total" — and then goes looking. 103 of 300 random inputs broke it.
//  Properties worth reaching for: round-trips (parse ∘ format = id),
//  conservation (money in = money out), invariants (sorted stays
//  sorted), and equivalence with an obvious-but-slow implementation.
//  The seeded generator matters as much as the property: a random test
//  that fails once and passes on re-run teaches nobody anything. Fixed
//  seed, printed counterexample, smallest first — a failure you can
//  paste into a debugger.
//  In the wild: invoice line items vs. invoice total, tax and discount
//  allocation, sharding a workload across N workers, paginating a count
//  into pages, and every "off by a cent" ticket finance has ever filed.

import { test, eq, ok } from '../../_lib/check.js';

export function splitAmount(totalCents, parts) {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents - base * parts;
  const shares = new Array(parts).fill(base);
  for (let i = 0; i < remainder; i++) shares[i] += 1;
  return shares;
}

// ─── a seeded generator, so a failure is the same failure tomorrow ───────

const lcg = (seed) => () => (seed = (seed * 1103515245 + 12345) % 2147483648);

function forAll(name, gen, property) {
  const next = lcg(20240614);
  const failures = [];
  for (let i = 0; i < 300; i++) {
    const input = gen(next);
    try {
      property(input);
    } catch {
      failures.push(input);
    }
  }
  if (failures.length === 0) return;
  const smallest = failures.sort((a, b) => a.total - b.total)[0];
  throw new Error(
    `${name}: ${failures.length}/300 inputs failed — smallest counterexample ` +
      `total=${smallest.total} parts=${smallest.parts} ` +
      `→ ${JSON.stringify(splitAmount(smallest.total, smallest.parts))}`
  );
}

const anySplit = (next) => ({
  total: next() % 10000,
  parts: (next() % 12) + 1,
});

// ──────────────────────────── tests ──────────────────────────────────────

test('an even split gives everyone the same share', () => {
  eq(splitAmount(100, 4), [25, 25, 25, 25]);
  eq(splitAmount(60, 3), [20, 20, 20]);
});

test('an uneven split hands the spare cents to the first people', () => {
  eq(splitAmount(100, 3), [34, 33, 33]);
  eq(splitAmount(1234, 2), [617, 617]);
});

test('one part gets the whole amount', () => {
  eq(splitAmount(999, 1), [999]);
});

test('the shares always sum to the total', () => {
  forAll('sum', anySplit, ({ total, parts }) => {
    const shares = splitAmount(total, parts);
    ok(shares.reduce((a, b) => a + b, 0) === total);
  });
});

test('no two shares differ by more than a cent', () => {
  forAll('spread', anySplit, ({ total, parts }) => {
    const shares = splitAmount(total, parts);
    ok(Math.max(...shares) - Math.min(...shares) <= 1);
  });
});
