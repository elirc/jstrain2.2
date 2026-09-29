// ─────────────────────────────────────────────────────────────────────────
//  12 · receipt                                             ★☆☆ warm-up
//  concepts: template literals · interpolation · multi-line strings
//  run: node 12-template-strings.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Backticks interpolate any expression with ${...} and keep real
//  newlines, so multi-line output needs no '\n' + concatenation soup.
//
//      badge({ name: 'Ada', email: 'ada@x.io' })  → 'Ada <ada@x.io>'
//
//      receipt({ id: 7, items: [{ name: 'Tea', qty: 2 },
//                               { name: 'Scone', qty: 1 }] })
//      →
//          Order #7
//          Tea x2
//          Scone x1
//          total: 3 items
//
//  With no items, the body line is exactly '(empty)' and the total is 0.
//  No trailing newline in either function.

import { test, eq, ok } from '../../_lib/check.js';

export function badge(user) {
  throw new Error('TODO');
}

export function receipt(order) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const ORDER = {
  id: 7,
  items: [
    { name: 'Tea', qty: 2 },
    { name: 'Scone', qty: 1 },
  ],
};

test('badge interpolates both fields', () => {
  eq(badge({ name: 'Ada', email: 'ada@x.io' }), 'Ada <ada@x.io>');
  eq(badge({ name: 'Bo', email: 'bo@y.io' }), 'Bo <bo@y.io>');
});

test('the receipt starts with the order header', () => {
  ok(receipt(ORDER).startsWith('Order #7'));
});

test('the receipt renders one line per item', () => {
  eq(receipt(ORDER), 'Order #7\nTea x2\nScone x1\ntotal: 3 items');
});

test('lines are separated by newlines, not spaces', () => {
  eq(receipt(ORDER).split('\n').length, 4);
  ok(!receipt(ORDER).endsWith('\n'), 'no trailing newline');
});

test('the total sums the quantities, not the line count', () => {
  const bulk = { id: 1, items: [{ name: 'Bean', qty: 40 }] };
  eq(receipt(bulk), 'Order #1\nBean x40\ntotal: 40 items');
});

test('an empty order says (empty)', () => {
  eq(receipt({ id: 3, items: [] }), 'Order #3\n(empty)\ntotal: 0 items');
});
