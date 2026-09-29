// ─────────────────────────────────────────────────────────────────────────
//  12 · priceFor · priceForStrict (recovering) — SOLUTION  ★★☆ core
//  run: node 12-catch-recovery.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `.catch(handler)` is `.then(undefined, handler)`. The
//  promise it returns is fulfilled with whatever the handler returns, so
//  the chain resumes normally — put the .catch BEFORE the .then that
//  formats and the formatting runs in both the happy and sad case.
//  To recover selectively, inspect the error and `throw` it again: a
//  throw inside a handler rejects that link, so the rejection keeps
//  travelling down the chain to the caller.
//  Wrong turn: `.catch((e) => e)` — returning the error object counts as
//  success, and the next step formats an Error as if it were data.

import { test, eq, ok, rejects } from '../../_lib/check.js';

const PRICES = { mug: 1000, tee: 2000 };

export function lookupPrice(sku) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!(sku in PRICES)) reject(new Error(`no price for ${sku}`));
      else resolve(PRICES[sku]);
    }, 5)
  );
}

export const format = (cents) => `$${(cents / 100).toFixed(2)}`;

export function priceFor(sku) {
  return lookupPrice(sku)
    .catch(() => 0)
    .then(format);
}

export function priceForStrict(sku) {
  return lookupPrice(sku)
    .catch((err) => {
      if (sku.startsWith('demo-')) return 0;
      throw err;
    })
    .then(format);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('formats a price that was found', async () => {
  eq(await priceFor('mug'), '$10.00');
});

test('recovers from a failed lookup', async () => {
  eq(await priceFor('ghost'), '$0.00');
});

test('the formatting step still runs after recovery', async () => {
  const label = await priceFor('ghost');
  ok(typeof label === 'string' && label.startsWith('$'));
});

test('strict mode passes real prices through', async () => {
  eq(await priceForStrict('tee'), '$20.00');
});

test('strict mode recovers for demo skus', async () => {
  eq(await priceForStrict('demo-mug'), '$0.00');
});

test('strict mode rethrows for everything else', async () => {
  await rejects(priceForStrict('ghost'), 'no price for ghost');
});
