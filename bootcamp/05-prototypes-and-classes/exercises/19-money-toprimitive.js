// ─────────────────────────────────────────────────────────────────────────
//  19 · Money and Symbol.toPrimitive                       ★★★ stretch
//  concepts: Symbol.toPrimitive · toString · coercion hints
//  run: node 19-money-toprimitive.js
// ─────────────────────────────────────────────────────────────────────────
//
//  When JS needs a primitive from your object it asks for one, and it
//  says WHY: hint 'string' (template literals, String()), hint 'number'
//  (arithmetic, comparison, unary +), or hint 'default' (`+` with an
//  unknown side, ==). Answer all three and your class behaves like a
//  built-in.
//
//  Build a Money class that stores integer cents in a #cents field:
//
//      const m = new Money(1234);
//      m.cents                → 1234        (getter)
//      m.amount               → 12.34       (getter)
//      String(m)              → '$12.34'
//      `${m}`                 → '$12.34'
//      Number(m)              → 12.34
//      m * 2                  → 24.68
//      'Total: ' + m          → 'Total: $12.34'
//      m.plus(new Money(66))  → a NEW Money of 1300 cents
//      new Money(1.5)         → throws TypeError 'cents must be an integer'
//
//  Implement [Symbol.toPrimitive](hint): the number hint returns the
//  amount, everything else returns the formatted string.
//
//  hint: computed method names work in class bodies —
//  `[Symbol.toPrimitive](hint) { ... }` — and toFixed(2) does the padding

import { test, eq, ok, approx, throws } from '../../_lib/check.js';

export class Money {
  constructor(cents) {
    throw new Error('TODO');
  }

  get cents() {
    throw new Error('TODO');
  }

  get amount() {
    throw new Error('TODO');
  }

  plus(other) {
    throw new Error('TODO');
  }

  toString() {
    throw new Error('TODO');
  }

  [Symbol.toPrimitive](hint) {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it formats itself as a string', () => {
  eq(String(new Money(1234)), '$12.34');
  eq(new Money(5).toString(), '$0.05');
  eq(new Money(1000).toString(), '$10.00');
});

test('template literals use the string hint', () => {
  const m = new Money(1234);
  eq(`Price: ${m}`, 'Price: $12.34');
});

test('arithmetic uses the number hint', () => {
  const m = new Money(1234);
  approx(Number(m), 12.34);
  approx(+m, 12.34);
  approx(m * 2, 24.68, 1e-9);
});

test('plain + falls back to the default hint, which is the label', () => {
  const m = new Money(1234);
  eq('Total: ' + m, 'Total: $12.34');
});

test('comparisons work because they ask for a number', () => {
  const cheap = new Money(500);
  const dear = new Money(1500);
  ok(dear > cheap);
  ok(cheap < dear);
  eq([dear, cheap].sort((a, b) => a - b).map(String), ['$5.00', '$15.00']);
});

test('plus returns a new Money and leaves both alone', () => {
  const a = new Money(1234);
  const b = new Money(66);
  const sum = a.plus(b);
  eq(sum.cents, 1300);
  eq(String(sum), '$13.00');
  eq(a.cents, 1234);
  ok(sum instanceof Money);
});

test('the amount getter is the number view', () => {
  const m = new Money(1234);
  approx(m.amount, 12.34);
  eq(Object.keys(m), [], 'cents is private');
});

test('fractional cents are rejected at construction', () => {
  const m = new Money(1);
  throws(() => new Money(1.5), 'cents must be an integer');
  throws(() => new Money('100'), 'cents must be an integer');
});
