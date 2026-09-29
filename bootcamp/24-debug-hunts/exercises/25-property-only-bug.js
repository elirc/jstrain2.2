// ─────────────────────────────────────────────────────────────────────────
//  25 · the bug only a property can see                     ★★★ stretch
//  concepts: property testing · rounding · invariants
//  run: node 25-property-only-bug.js
// ─────────────────────────────────────────────────────────────────────────
//
//  splitAmount(totalCents, parts) divides a payment between people. Two
//  invariants, and they are the whole specification:
//
//      1. the shares sum to EXACTLY the total — no cent invented, none lost
//      2. no two shares differ by more than one cent
//
//      splitAmount(100, 3) → [34, 33, 33]
//
//  Every example test below is green. Finance still opened a ticket:
//  some split payouts are a few cents over, some are under, and the
//  reconciliation job has been failing quietly for a month.
//
//  The red test is the property — it generates hundreds of inputs from
//  a fixed seed, and the failure message prints the smallest one it
//  found. That counterexample is your bug report; start there, not at
//  the top of the function.
//
//  hint: run the counterexample by hand, on paper, one line at a time.
//  What is `base`, what is `remainder`, and what does the loop do when
//  `remainder` turns out to be a number the author never pictured?

import { test, eq, ok } from '../../_lib/check.js';

export function splitAmount(totalCents, parts) {
  const base = Math.round(totalCents / parts);
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
