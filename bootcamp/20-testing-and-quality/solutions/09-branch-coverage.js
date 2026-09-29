// ─────────────────────────────────────────────────────────────────────────
//  09 · branch coverage by hand — SOLUTION                      ★★☆ core
//  run: node 09-branch-coverage.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: coverage tooling tells you WHAT you missed; picking inputs
//  is the skill it cannot give you. Work the chain from the bottom up,
//  because every rule after the first carries the negation of all the ones
//  above it. `standard` is not "any small order" — it is "under 100, not
//  express, at most 20kg", three constraints deep. Beginners write four
//  orders that all fall into `free` and report "four tests, all passing".
//  The minimality test is the interesting one. It removes each input in
//  turn and demands that coverage DROPS. That is what makes a suite
//  honest: every case earns its place, and a redundant test is one more
//  thing to maintain for zero information.
//  `branchesHit` sorts and dedupes so the result is a set-like value you
//  can compare with `eq` — an order-dependent coverage report would fail
//  for reasons that have nothing to do with coverage.
//  100% branch coverage still is not proof: these four inputs never try a
//  negative total or a missing field. Coverage is a floor, not a ceiling.

import { test, eq, ok } from '../../_lib/check.js';

// Provided: the unit under test, instrumented. It calls hit(name) with
// the branch it took. The rules, in order:
//   1. total >= 100          → free      (0)
//   2. express               → express   (15)
//   3. weightKg > 20         → heavy     (12)
//   4. otherwise             → standard  (5)
function shippingCost(order, hit) {
  if (order.total >= 100) {
    hit('free');
    return 0;
  }
  if (order.express) {
    hit('express');
    return 15;
  }
  if (order.weightKg > 20) {
    hit('heavy');
    return 12;
  }
  hit('standard');
  return 5;
}

// Provided: run one order through the instrumented function.
export function recordBranches(order) {
  const branches = [];
  const cost = shippingCost(order, (name) => branches.push(name));
  return { cost, branches };
}

export const ALL_BRANCHES = ['express', 'free', 'heavy', 'standard'];
export const COST_OF = { free: 0, express: 15, heavy: 12, standard: 5 };

export function branchesHit(orders) {
  const seen = new Set();
  for (const order of orders) {
    for (const name of recordBranches(order).branches) seen.add(name);
  }
  return [...seen].sort();
}

export function minimalInputs() {
  return [
    { total: 150, weightKg: 1, express: false },
    { total: 40, weightKg: 1, express: true },
    { total: 40, weightKg: 25, express: false },
    { total: 40, weightKg: 1, express: false },
  ];
}

// ──────────────────────────── tests ──────────────────────────────────────

test('branchesHit names the branch one order takes', () => {
  eq(branchesHit([{ total: 150, weightKg: 1, express: false }]), ['free']);
  eq(branchesHit([{ total: 10, weightKg: 1, express: false }]), ['standard']);
});

test('branchesHit dedupes and sorts', () => {
  const small = { total: 10, weightKg: 1, express: false };
  const heavy = { total: 10, weightKg: 30, express: false };
  eq(branchesHit([small, heavy, small]), ['heavy', 'standard']);
});

test('the first matching rule wins — free beats express and heavy', () => {
  eq(branchesHit([{ total: 500, weightKg: 99, express: true }]), ['free']);
  eq(branchesHit([{ total: 50, weightKg: 99, express: true }]), ['express']);
});

test('minimalInputs covers every branch', () => {
  eq(branchesHit(minimalInputs()), ALL_BRANCHES);
});

test('minimalInputs uses exactly one order per branch', () => {
  eq(minimalInputs().length, ALL_BRANCHES.length);
});

test('no input is redundant — dropping any one loses coverage', () => {
  const inputs = minimalInputs();
  inputs.forEach((_, i) => {
    const without = inputs.filter((_, j) => j !== i);
    const covered = branchesHit(without);
    ok(
      covered.length < ALL_BRANCHES.length,
      `input ${i} is redundant: coverage stayed at ${covered.join(',')}`
    );
  });
});

test('every input is a well-formed order', () => {
  for (const order of minimalInputs()) {
    ok(typeof order.total === 'number', 'total must be a number');
    ok(typeof order.weightKg === 'number', 'weightKg must be a number');
    ok(typeof order.express === 'boolean', 'express must be a boolean');
  }
});

test('each input produces the cost of the branch it exercises', () => {
  for (const order of minimalInputs()) {
    const { cost, branches } = recordBranches(order);
    eq(branches.length, 1);
    eq(cost, COST_OF[branches[0]]);
  }
});
