// ─────────────────────────────────────────────────────────────────────────
//  07 · the case that never came — SOLUTION                ★★☆ core
//  run: node ../run.js solutions/07-discriminated-fallthrough.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — a variant of a discriminated union with no case of its
//  own, swallowed by a `default` that answered for it.
//
//  THE TELL — a plausible-but-neutral answer: 0, '', null, "unknown".
//  A refund contributes exactly nothing to the balance, which is what a
//  fallback returns when it has no idea what it is looking at. When a
//  result is suspiciously neutral, look for the branch that produces
//  neutral results.
//
//  Count the cases against the union: four members, three cases.
//
//  WHY TSC COULD NOT CATCH IT — a `default` clause makes the switch
//  total, so every path returns a `number` and the declared return type
//  is satisfied. Exhaustiveness checking in TypeScript is not automatic;
//  it is something you ASK for, and `default: return 0` is the exact
//  phrasing that declines to ask. (Without the default, and with the
//  return type annotated, tsc would have reported TS2366 — "function
//  lacks ending return statement" — which is the same bug caught at
//  compile time.)
//
//  THE FIX — the missing case, plus a default that cannot stay quiet:
//
//      default: {
//        const unreachable: never = event;
//        throw new Error(...);
//      }
//
//  `never` is the empty type: assigning to it succeeds only when the
//  compiler has proved no members are left. Add a fifth variant to
//  `LedgerEvent` tomorrow and THIS line fails to compile, pointing at
//  every switch that has not caught up. That is the real repair — not
//  the case that was missing, but the mechanism that makes the next
//  missing case a compile error instead of a wrong number on an invoice.

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
    case 'refund':
      return -event.cents;
    case 'fee':
      return -event.cents;
    case 'adjustment':
      return event.cents * event.sign;
    default: {
      const unreachable: never = event;
      throw new Error(`unhandled ledger event: ${JSON.stringify(unreachable)}`);
    }
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
