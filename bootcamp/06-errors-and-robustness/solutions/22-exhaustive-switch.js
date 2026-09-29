// ─────────────────────────────────────────────────────────────────────────
//  22 · the case you forgot to handle — SOLUTION            ★☆☆ warm-up
//  run: node 22-exhaustive-switch.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `assertUnreachable` is three lines and it is the whole
//  idea — a function whose only job is to be impossible to reach, so
//  that reaching it is news. Putting it in the `default` arm converts a
//  silent undefined into a stack trace that points at the exact switch
//  somebody forgot to update.
//  `String(value)` in the message is deliberate: the offending value is
//  often null, a number, or a typo'd string, and `${value}` on a symbol
//  would throw a second, more confusing error.
//  In TypeScript the same helper is typed `(value: never)` and the
//  compiler catches the missing case before you run anything. In plain
//  JS you get the runtime version — later, but still loud.
//  Classic wrong turn: `default: return 'Unknown'`. The badge renders,
//  the bug ships, and the only trace is a support ticket in March.

import { test, eq, throws } from '../../_lib/check.js';

export function assertUnreachable(value) {
  throw new Error(`unhandled case: ${String(value)}`);
}

export function labelFor(status) {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'sent':
      return 'Awaiting payment';
    case 'paid':
      return 'Paid';
    case 'void':
      return 'Cancelled';
    default:
      return assertUnreachable(status);
  }
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
