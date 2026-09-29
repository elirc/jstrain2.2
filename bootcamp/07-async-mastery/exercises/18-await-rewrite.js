// ─────────────────────────────────────────────────────────────────────────
//  18 · receiptFor (rewrite a chain with await)            ★★☆ core
//  concepts: async functions · await · scope
//  run: node 18-await-rewrite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Here is the .then version of the job. Rewrite it with async/await:
//
//      fetchItem(sku)
//        .then((item) => applyDiscount(item, qty)
//          .then((cents) => `receipt: ${qty} x ${item.sku} = ...`))
//
//      receiptFor('mug', 1)  → 'receipt: 1 x mug = $10.00'
//      receiptFor('mug', 3)  → 'receipt: 3 x mug = $27.00'  (bulk -10%)
//
//  Look at that nesting: the .then version has to nest the second call
//  inside the first, because the final line needs BOTH `item` and
//  `cents`. With await, both are just local variables.
//
//  hint: mark the function `async`, then `const item = await fetchItem(sku)`

import { test, eq, ok, rejects } from '../../_lib/check.js';

const CENTS = { mug: 1000, tee: 2000 };

export function fetchItem(sku) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!(sku in CENTS)) reject(new Error(`unknown sku ${sku}`));
      else resolve({ sku, cents: CENTS[sku] });
    }, 5)
  );
}

// 10% off when you buy three or more.
export function applyDiscount(item, qty) {
  const total = item.cents * qty;
  const due = qty >= 3 ? Math.round(total * 0.9) : total;
  return new Promise((resolve) => setTimeout(() => resolve(due), 5));
}

const usd = (cents) => `$${(cents / 100).toFixed(2)}`;

export function receiptFor(sku, qty) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('builds a receipt for a single item', async () => {
  eq(await receiptFor('mug', 1), 'receipt: 1 x mug = $10.00');
});

test('applies the bulk discount', async () => {
  eq(await receiptFor('mug', 3), 'receipt: 3 x mug = $27.00');
});

test('works for another sku', async () => {
  eq(await receiptFor('tee', 2), 'receipt: 2 x tee = $40.00');
});

test('still has the item in scope for the last line', async () => {
  const line = await receiptFor('tee', 1);
  ok(line.includes('x tee'), 'the sku from step one must reach the label');
});

test('returns a promise, not the string', () => {
  ok(receiptFor('mug', 1) instanceof Promise);
});

test('a failure inside becomes a rejection', async () => {
  await rejects(receiptFor('ghost', 1), 'unknown sku ghost');
});
