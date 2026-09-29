// ─────────────────────────────────────────────────────────────────────────
//  07 · the case that never came                           ★★☆ core
//  concepts: discriminated unions · switch defaults · exhaustiveness
//  run: node ../run.js exercises/07-discriminated-fallthrough.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A ledger in minor units. `delta` says what one event does to the
//  balance; `balance` adds a day of them up. Money in is positive, money
//  out is negative:
//
//      charge      → the customer paid us            → +cents
//      refund      → we gave it back                 → −cents
//      fee         → the processor took a slice      → −cents
//      adjustment  → a human moved it, sign included → cents × sign
//
//      delta({ type: 'charge', cents: 500 })                 →  500
//      delta({ type: 'refund', cents: 500 })                 → -500
//      delta({ type: 'adjustment', cents: 25, sign: -1 })    →  -25
//      balance([charge 500, refund 200, fee 15])             →  285
//
//  tsc has no objection to this file. Two tests do. Find the bug, make
//  the smallest fix — and while you are in there, make the compiler
//  responsible for catching the next one.
//
//  hint: ask what this switch does with an event it was never taught.
//  Then ask which line let it stay quiet about it.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type LedgerEvent =
  | { type: 'charge'; cents: number }
  | { type: 'refund'; cents: number }
  | { type: 'fee'; cents: number; reason: string }
  | { type: 'adjustment'; cents: number; sign: -1 | 1 };

export function delta(event: LedgerEvent): number {
  switch (event.type) {
    case 'charge':
      return event.cents;
    case 'fee':
      return -event.cents;
    case 'adjustment':
      return event.cents * event.sign;
    default:
      return 0;
  }
}

export function balance(events: LedgerEvent[]): number {
  return events.reduce((sum, event) => sum + delta(event), 0);
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('a charge is money in', () => {
  eq(delta({ type: 'charge', cents: 500 }), 500);
});

test('a fee is money out', () => {
  eq(delta({ type: 'fee', cents: 15, reason: 'processing' }), -15);
});

test('an adjustment follows its own sign', () => {
  eq(delta({ type: 'adjustment', cents: 25, sign: -1 }), -25);
  eq(delta({ type: 'adjustment', cents: 25, sign: 1 }), 25);
});

test('a refund gives the money back', () => {
  eq(delta({ type: 'refund', cents: 500 }), -500);
});

test('an empty ledger is zero', () => {
  eq(balance([]), 0);
});

test("a day's ledger nets out", () => {
  eq(
    balance([
      { type: 'charge', cents: 500 },
      { type: 'refund', cents: 200 },
      { type: 'fee', cents: 15, reason: 'processing' },
    ]),
    285
  );
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof delta>, number>>;
type _t2 = Expect<
  Equal<LedgerEvent['type'], 'charge' | 'refund' | 'fee' | 'adjustment'>
>;

function _typeTests() {
  const n: number = delta({ type: 'refund', cents: 1 });
  use(n);

  // @ts-expect-error — 'chargeback' is not in the union
  delta({ type: 'chargeback', cents: 1 });

  // @ts-expect-error — an adjustment needs a sign
  delta({ type: 'adjustment', cents: 1 });

  // @ts-expect-error — the sign is -1 or 1, nothing else
  delta({ type: 'adjustment', cents: 1, sign: 2 });
}
use(_typeTests);
