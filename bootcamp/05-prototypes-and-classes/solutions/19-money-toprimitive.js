// ─────────────────────────────────────────────────────────────────────────
//  19 · Money and Symbol.toPrimitive — SOLUTION            ★★★ stretch
//  run: node 19-money-toprimitive.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `[Symbol.toPrimitive]` is a method whose key is a symbol
//  rather than a string, and it lives on Money.prototype like any other
//  method. When it exists, it is the ONLY thing consulted — valueOf and
//  toString are skipped entirely — and it is handed the hint so one
//  method can serve three situations:
//
//      `${m}`      → 'string'   → '$12.34'
//      m * 2       → 'number'   → 12.34
//      'x' + m     → 'default'  → '$12.34' (we choose the label)
//
//  Choosing the label for 'default' is a design decision: it makes
//  string concatenation read well at the cost of `m1 + m2` being
//  nonsense. That is why `plus()` exists — money addition should return
//  Money, not a number, and it does so without mutating either side.
//
//  Storing integer cents avoids 0.1 + 0.2 problems; the only float in
//  sight is the display conversion. And keeping #cents private means
//  Object.keys sees nothing, so the class controls every view of itself.

import { test, eq, ok, approx, throws } from '../../_lib/check.js';

export class Money {
  #cents;

  constructor(cents) {
    if (!Number.isInteger(cents)) {
      throw new TypeError('cents must be an integer');
    }
    this.#cents = cents;
  }

  get cents() {
    return this.#cents;
  }

  get amount() {
    return this.#cents / 100;
  }

  plus(other) {
    return new Money(this.#cents + other.cents);
  }

  toString() {
    return `$${this.amount.toFixed(2)}`;
  }

  [Symbol.toPrimitive](hint) {
    return hint === 'number' ? this.amount : this.toString();
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
