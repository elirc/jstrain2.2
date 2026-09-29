// ─────────────────────────────────────────────────────────────────────────
//  10 · configuration by closure — SOLUTION                 ★★☆ core
//  run: node 10-closure-config.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the destructuring happens ONCE, in the factory body. The
//  returned arrow closes over `symbol`, `decimals` and `thousands`, so the
//  hot path does no option parsing and no defaulting — that work was paid
//  for at configuration time. Two formatters made from the same factory
//  get two separate closures, which is why they cannot interfere.
//  One real trap: `String.replace` treats `$` specially in a replacement
//  STRING ('$&' means the whole match). Passing a FUNCTION as the
//  replacement — `() => thousands` — sidesteps that entirely and keeps the
//  separator literal whatever it is.
//  Money is rounded through `Math.round(n * 100) / 100` because 110 * 0.08
//  is 8.800000000000001 in binary floating point.

import { test, eq, ok } from '../../_lib/check.js';

const round2 = (n) => Math.round(n * 100) / 100;

export function makeFormatter(options = {}) {
  const { symbol = '$', decimals = 2, thousands = ',' } = options;
  return (amount) => {
    const sign = amount < 0 ? '-' : '';
    const [whole, fraction] = Math.abs(amount).toFixed(decimals).split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, () => thousands);
    return sign + symbol + grouped + (fraction ? `.${fraction}` : '');
  };
}

export function makeTaxCalculator(options) {
  const { rate, shippingTaxable = false } = options;
  return ({ subtotal, shipping }) => {
    const base = shippingTaxable ? subtotal + shipping : subtotal;
    const tax = round2(base * rate);
    return { tax, total: round2(subtotal + shipping + tax) };
  };
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
