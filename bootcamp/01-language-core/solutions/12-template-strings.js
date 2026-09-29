// ─────────────────────────────────────────────────────────────────────────
//  12 · receipt — SOLUTION                                  ★☆☆ warm-up
//  run: node 12-template-strings.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: build the variable-length middle as an array of strings
//  and join it, then drop that single value into a template literal whose
//  line breaks are literal newlines in the source. Trying to build the
//  whole thing with one nested template plus a map() inside ${...} works
//  too, but you get an extra comma-free blank line the moment the list is
//  empty — which is exactly why the (empty) placeholder is computed
//  first.
//
//  Note the indentation trap: a template literal keeps every space you
//  type, so the continuation lines must start at column 0.

import { test, eq, ok } from '../../_lib/check.js';

export function badge(user) {
  return `${user.name} <${user.email}>`;
}

export function receipt(order) {
  const lines = order.items.map((item) => `${item.name} x${item.qty}`);
  const body = lines.length > 0 ? lines.join('\n') : '(empty)';
  const total = order.items.reduce((sum, item) => sum + item.qty, 0);
  return `Order #${order.id}
${body}
total: ${total} items`;
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
