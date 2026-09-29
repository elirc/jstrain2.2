// ─────────────────────────────────────────────────────────────────────────
//  22 · the case you forgot to handle                       ★☆☆ warm-up
//  concepts: exhaustiveness · switch defaults · loud failure
//  run: node 22-exhaustive-switch.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Six months from now somebody adds a 'refunded' invoice status. Every
//  switch over that status is now wrong, and plain JavaScript will not
//  say a word — the switch falls off the end and returns undefined, the
//  UI renders an empty badge, and nobody notices for a week. Make the
//  default arm shout instead.
//
//    assertUnreachable(value) → never returns; throws
//        'unhandled case: refunded'
//
//    labelFor(status) → the badge text, via a switch that ends in
//                       `default: return assertUnreachable(status);`
//
//        draft → 'Draft'          paid → 'Paid'
//        sent  → 'Awaiting payment'   void → 'Cancelled'
//
//  hint: `default: return ''` is the trap. A wrong answer that looks
//  fine is worse than a crash with a stack trace pointing at the switch.

import { test, eq, throws } from '../../_lib/check.js';

export function assertUnreachable(value) {
  throw new Error('TODO');
}

export function labelFor(status) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('every known status has its label', () => {
  eq(labelFor('draft'), 'Draft');
  eq(labelFor('sent'), 'Awaiting payment');
  eq(labelFor('paid'), 'Paid');
  eq(labelFor('void'), 'Cancelled');
});

test('assertUnreachable always throws, and names the value', () => {
  throws(() => assertUnreachable('refunded'), 'unhandled case: refunded');
});

test('it describes odd values instead of crashing on them', () => {
  throws(() => assertUnreachable(null), 'unhandled case: null');
  throws(() => assertUnreachable(42), 'unhandled case: 42');
});

test('an unknown status throws instead of returning undefined', () => {
  throws(() => labelFor('refunded'), 'unhandled case: refunded');
});

test('a status added later trips the same wire', () => {
  throws(() => labelFor('disputed'), 'unhandled case: disputed');
});

test('a mis-cased status is caught at the switch itself', () => {
  throws(() => labelFor('Draft'), 'unhandled case: Draft');
});
