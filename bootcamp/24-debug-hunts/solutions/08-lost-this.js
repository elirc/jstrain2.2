// ─────────────────────────────────────────────────────────────────────────
//  08 · Ledger — SOLUTION                                       ★★☆ core
//  run: node 08-lost-this.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a lost `this`. The method was fine; the call site threw
//  it away.
//
//  The tell: `.map(this.format)`. Reading `this.format` fetches the plain
//  function and drops the object it came from — `this` is decided by HOW
//  a function is called, not where it was defined. map() then calls it
//  with no receiver, and in a class body (always strict) that means
//  `this` is undefined, so `this.symbol` throws. The stack points at
//  format(), which is the innocent party; receipt() calls the very same
//  method and works, because there the call is `this.format(...)`.
//
//  The fix: keep the call a method call by wrapping it —
//
//      return this.entries.map((entry) => this.format(entry.cents));
//
//  An arrow closes over the surrounding `this`, so nothing can detach it.
//  `.map(this.format, this)` and `.map(this.format.bind(this))` also work;
//  the arrow reads best and, unlike bind, does not forward map's extra
//  index/array arguments.
//
//  In the wild: `element.addEventListener('click', this.onClick)`,
//  `setTimeout(this.tick, 100)`, and `promise.then(logger.log)` — every
//  one of them a method handed over as a bare value.

import { test, eq, ok, throws } from '../../_lib/check.js';

const SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };

export class Ledger {
  constructor(currency = 'USD') {
    this.currency = currency;
    this.symbol = SYMBOLS[currency] ?? currency;
    this.entries = [];
  }

  add(label, cents) {
    if (!Number.isInteger(cents)) {
      throw new TypeError(`amount must be whole cents: ${cents}`);
    }
    this.entries.push({ label, cents });
    return this;
  }

  get totalCents() {
    return this.entries.reduce((sum, entry) => sum + entry.cents, 0);
  }

  format(cents) {
    const sign = cents < 0 ? '-' : '';
    return `${sign}${this.symbol}${(Math.abs(cents) / 100).toFixed(2)}`;
  }

  formatAll() {
    return this.entries.map((entry) => this.format(entry.cents));
  }

  receipt() {
    const lines = this.entries.map(
      (entry) => `${entry.label}: ${this.format(entry.cents)}`
    );
    return [...lines, `total: ${this.format(this.totalCents)}`].join('\n');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('add chains and records entries in order', () => {
  const ledger = new Ledger().add('coffee', 450).add('refund', -200);
  ok(ledger instanceof Ledger, 'add should return the ledger');
  eq(ledger.entries, [
    { label: 'coffee', cents: 450 },
    { label: 'refund', cents: -200 },
  ]);
  throws(() => ledger.add('bad', 4.5), 'whole cents');
});

test('format renders one amount with the ledger symbol', () => {
  const ledger = new Ledger('USD');
  eq(ledger.format(450), '$4.50');
  eq(ledger.format(-200), '-$2.00');
  eq(ledger.format(0), '$0.00');
});

test('totalCents adds every entry up', () => {
  const ledger = new Ledger().add('coffee', 450).add('refund', -200);
  eq(ledger.totalCents, 250);
  eq(new Ledger().totalCents, 0);
});

test('receipt lists every entry and then the total', () => {
  const ledger = new Ledger().add('coffee', 450).add('refund', -200);
  eq(ledger.receipt(), 'coffee: $4.50\nrefund: -$2.00\ntotal: $2.50');
});

test('formatAll formats every entry', () => {
  const ledger = new Ledger().add('coffee', 450).add('bagel', 325);
  eq(ledger.formatAll(), ['$4.50', '$3.25']);
});

test('formatAll keeps the sign on a refund', () => {
  const ledger = new Ledger().add('refund', -200).add('fee', 99);
  eq(ledger.formatAll(), ['-$2.00', '$0.99']);
});

test('a ledger in another currency uses its own symbol everywhere', () => {
  const ledger = new Ledger('EUR').add('book', 1250);
  eq(ledger.format(1250), '€12.50');
  eq(ledger.formatAll(), ['€12.50']);
  eq(ledger.receipt(), 'book: €12.50\ntotal: €12.50');
});

test('an empty ledger formats to nothing at all', () => {
  const ledger = new Ledger();
  eq(ledger.formatAll(), []);
  eq(ledger.receipt(), 'total: $0.00');
});
