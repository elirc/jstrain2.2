// ─────────────────────────────────────────────────────────────────────────
//  05 · the key that was not there — SOLUTION              ★★☆ core
//  run: node ../run.js solutions/05-record-lookup.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//
//  BUG CLASS — an index lookup that missed, and an `undefined` that
//  travelled instead of stopping.
//
//  THE TELL — NaN. `Math.round(NaN)` is NaN, `0 + NaN` is NaN, and NaN
//  is not equal to itself, so it moves through arithmetic without ever
//  raising a hand. Trace a NaN backwards and it always ends at the same
//  two places: a parse that failed, or a lookup that missed.
//
//  Print `RATES[key]` on the line it is produced and you get `undefined`
//  while the type on that line says `number`.
//
//  WHY TSC COULD NOT CATCH IT — `Record<string, number>` says "every
//  string key maps to a number", and by default TypeScript takes that at
//  face value: `RATES['xbt']` types as `number`, full stop. The compiler
//  flag that changes this is `noUncheckedIndexedAccess`, which is NOT
//  part of `--strict` — a deliberate ergonomics call by the TS team, and
//  the single most common source of this bug in strict codebases.
//
//  THE FIX — model the table honestly and check the result:
//  `Record<string, number | undefined>` makes every lookup return
//  `number | undefined`, and the `if` below it is then the only way to
//  get a `number` out. Type widened by one word, bug now impossible.
//  Where you own the whole codebase, turning on `noUncheckedIndexedAccess`
//  does the same thing for every index expression at once.
//
//  Note where the check goes: at the lookup, not at the arithmetic.
//  `undefined` is cheap to handle at the boundary it enters and
//  expensive three frames later, when all you have is a NaN in a total.

import { test, eq, throws } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export interface Line {
  amount: number;
  currency: string;
}

const RATES: Record<string, number | undefined> = {
  usd: 1,
  eur: 1.08,
  gbp: 1.27,
  jpy: 0.0064,
};

export function rateFor(currency: string): number {
  const key = currency.trim().toLowerCase();
  const rate = RATES[key];
  if (rate === undefined) throw new Error(`unsupported currency: ${key}`);
  return rate;
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
