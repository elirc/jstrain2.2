// ─────────────────────────────────────────────────────────────────────────
//  12 · priceFor · priceForStrict (recovering)             ★★☆ core
//  concepts: .catch as recovery · rethrowing · chain resumption
//  run: node 12-catch-recovery.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A .catch is not the end of a chain — it is a repair shop. Whatever it
//  returns becomes the value the chain continues with.
//
//      priceFor('mug')        → '$10.00'
//      priceFor('ghost')      → '$0.00'   (lookup failed, recovered to 0)
//      priceForStrict('mug')  → '$10.00'
//      priceForStrict('demo-x') → '$0.00' (demo skus are free)
//      priceForStrict('ghost')  → rejects with Error('no price for ghost')
//
//  Both must call format(cents) AFTER recovering — the formatting step
//  runs on the recovered value too. In the strict version, rethrow the
//  error for any sku that is not a demo.
//
//  hint: returning from .catch fulfils; throwing from .catch re-rejects

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
  throw new Error('TODO');
}

export function priceForStrict(sku) {
  throw new Error('TODO');
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
