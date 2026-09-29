// ─────────────────────────────────────────────────────────────────────────
//  10 · configuration by closure                            ★★☆ core
//  concepts: closures · factories · partial application
//  run: node 10-closure-config.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Passing the same options object to the same function 400 times is a
//  smell. Configure ONCE, get back a function that only needs the data.
//  That is partial application without any currying machinery.
//
//      const eur = makeFormatter({ symbol: '€', decimals: 0 });
//      eur(1234.5)                      → '€1,235'
//      makeFormatter({})(1234.5)        → '$1,234.50'
//      makeFormatter({})(-1234.5)       → '-$1,234.50'   (sign outermost)
//
//      const vat = makeTaxCalculator({ rate: 0.2 });
//      vat({ subtotal: 100, shipping: 10 })  → { tax: 20, total: 130 }
//
//  makeFormatter options: symbol ('$'), decimals (2), thousands (',').
//  Group the integer part in threes; with decimals 0 there is no point.
//  makeTaxCalculator options: rate, and shippingTaxable (false) — when
//  false, tax is charged on the subtotal only. Round money to 2 decimals.
//
//  hint: default the options where you destructure them, outside the
//  returned function — that is the "configure once" part.

import { test, eq, ok } from '../../_lib/check.js';

export function makeFormatter(options = {}) {
  throw new Error('TODO');
}

export function makeTaxCalculator(options) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('defaults to dollars with two decimals', () => {
  eq(makeFormatter({})(1234.5), '$1,234.50');
});

test('uses the configured symbol and decimal places', () => {
  eq(makeFormatter({ symbol: '€', decimals: 0 })(1234.5), '€1,235');
});

test('groups every three digits with the configured separator', () => {
  eq(makeFormatter({ symbol: '', thousands: ' ' })(1000000), '1 000 000.00');
  eq(makeFormatter({})(999), '$999.00');
});

test('the sign goes outside the symbol', () => {
  eq(makeFormatter({})(-1234.5), '-$1,234.50');
});

test('two formatters from the same factory stay independent', () => {
  const dollars = makeFormatter({});
  const yen = makeFormatter({ symbol: '¥', decimals: 0 });
  eq(dollars(5), '$5.00');
  eq(yen(5), '¥5');
  eq(dollars(5), '$5.00');
});

test('tax is charged on the subtotal, not the shipping, by default', () => {
  const calc = makeTaxCalculator({ rate: 0.08 });
  eq(calc({ subtotal: 100, shipping: 10 }), { tax: 8, total: 118 });
});

test('shippingTaxable puts shipping into the taxable base', () => {
  const calc = makeTaxCalculator({ rate: 0.08, shippingTaxable: true });
  eq(calc({ subtotal: 100, shipping: 10 }), { tax: 8.8, total: 118.8 });
});

test('one configured calculator handles many orders', () => {
  const calc = makeTaxCalculator({ rate: 0.1 });
  eq(calc({ subtotal: 19.99, shipping: 0 }).tax, 2);
  eq(calc({ subtotal: 5, shipping: 2.5 }).total, 8);
  ok(typeof calc === 'function');
});
