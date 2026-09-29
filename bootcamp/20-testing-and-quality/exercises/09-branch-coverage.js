// ─────────────────────────────────────────────────────────────────────────
//  09 · branch coverage by hand                                 ★★☆ core
//  concepts: coverage · input design · reading a spec
//  run: node 09-branch-coverage.js
// ─────────────────────────────────────────────────────────────────────────
//
//  No istanbul on this plane, and you do not need it. `shippingCost` below
//  is provided, instrumented: it reports which of its four branches it
//  took. Your job is the part a coverage tool cannot do for you — choose
//  the INPUTS.
//
//      branchesHit([order])                → ['free']
//      branchesHit([small, heavy, small])  → ['heavy', 'standard']
//        (sorted, deduped — a set, not a log)
//
//      minimalInputs()   → the smallest list of orders that reaches all
//                          four branches. Exactly one order per branch:
//                          removing ANY of them must lose coverage.
//
//  An order is `{ total, weightKg, express }`. The rules run in order, and
//  that is the whole difficulty: a later branch is only reachable when
//  every earlier condition was false.
//
//  hint: work bottom-up. To reach `standard` an order must be under 100
//  AND not express AND at most 20kg — three constraints, not one.

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
  throw new Error('TODO');
}

export function minimalInputs() {
  throw new Error('TODO');
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
