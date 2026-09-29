// ─────────────────────────────────────────────────────────────────────────
//  18 · receiptFor (rewrite a chain with await) — SOLUTION ★★☆ core
//  run: node 18-await-rewrite.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `async` makes the function return a promise no matter
//  what; `await` unwraps a promise into a plain value inside the body.
//  The result reads like synchronous code — three statements, no
//  callbacks — and every intermediate value stays in scope for the rest
//  of the function. That scoping is the real win over .then chains,
//  where each handler only sees what the previous one returned.
//  Nothing is blocked: await suspends this function and returns control
//  to the event loop until the awaited promise settles.
//  Wrong turn: forgetting `async`, then `await` is a syntax error — or
//  forgetting `await` and formatting a Promise object into the string.

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

export async function receiptFor(sku, qty) {
  const item = await fetchItem(sku);
  const cents = await applyDiscount(item, qty);
  return `receipt: ${qty} x ${item.sku} = ${usd(cents)}`;
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
