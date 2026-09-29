// ─────────────────────────────────────────────────────────────────────────
//  05 · the key that was not there                         ★★☆ core
//  concepts: Record index access · missing keys · NaN propagation
//  run: node ../run.js exercises/05-record-lookup.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A tiny FX helper. Amounts are in minor units (cents, pence, yen), and
//  `toUsd` converts one line into US cents, rounded. Lookups forgive case
//  and padding. A currency the table has never heard of is an ERROR —
//  loudly, at the lookup — never a quiet number.
//
//      rateFor('usd')                          → 1
//      rateFor(' EUR ')                        → 1.08
//      rateFor('xbt')                          → throws
//                                       'unsupported currency: xbt'
//      toUsd({ amount: 1000, currency: 'eur' })      → 1080
//      totalUsd([usd 100, eur 1000])                 → 1180
//      totalUsd([usd 100, xbt 1])                    → throws
//
//  tsc reports nothing. Two tests fail. Find the bug, fix it as small as
//  you can, and leave the rest of the file alone.
//
//  hint: print the value the moment it leaves the table, before anything
//  arithmetic happens to it. Compare what you see against what the type
//  on that line claims.

import { test, eq, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Line {
  amount: number;
  currency: string;
}

const RATES: Record<string, number> = {
  usd: 1,
  eur: 1.08,
  gbp: 1.27,
  jpy: 0.0064,
};

export function rateFor(currency: string): number {
  const key = currency.trim().toLowerCase();
  return RATES[key];
}

export function toUsd(line: Line): number {
  return Math.round(line.amount * rateFor(line.currency));
}

export function totalUsd(lines: Line[]): number {
  return lines.reduce((sum, line) => sum + toUsd(line), 0);
}

export function supported(): string[] {
  return Object.keys(RATES).sort();
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('the dollar is its own rate', () => {
  eq(rateFor('usd'), 1);
});

test('a lookup forgives case and padding', () => {
  eq(rateFor(' EUR '), 1.08);
  eq(rateFor('GBP'), 1.27);
});

test('a line converts and rounds to whole cents', () => {
  eq(toUsd({ amount: 1000, currency: 'eur' }), 1080);
  eq(toUsd({ amount: 10000, currency: 'jpy' }), 64);
});

test('a total adds the converted lines up', () => {
  eq(
    totalUsd([
      { amount: 100, currency: 'usd' },
      { amount: 1000, currency: 'eur' },
    ]),
    1180
  );
});

test('a currency the table never heard of is an error', () => {
  throws(() => rateFor('xbt'), 'unsupported currency: xbt');
});

test('one unknown line fails the whole total', () => {
  throws(
    () =>
      totalUsd([
        { amount: 100, currency: 'usd' },
        { amount: 1, currency: 'XBT' },
      ]),
    'unsupported currency: xbt'
  );
});

test('the table can list what it knows', () => {
  eq(supported(), ['eur', 'gbp', 'jpy', 'usd']);
});

// ──────────────────────────── type tests ─────────────────────────────────
//
//  These already pass — in the broken file and in the fixed one. That is
//  the whole point of the module: the type layer is satisfied either way.

type _t1 = Expect<Equal<ReturnType<typeof rateFor>, number>>;
type _t2 = Expect<Equal<ReturnType<typeof totalUsd>, number>>;

function _typeTests() {
  const cents: number = toUsd({ amount: 1, currency: 'usd' });
  use(cents);

  // @ts-expect-error — a Line needs a currency
  toUsd({ amount: 1 });

  // @ts-expect-error — totalUsd takes a list of lines, not one line
  totalUsd({ amount: 1, currency: 'usd' });
}
use(_typeTests);
