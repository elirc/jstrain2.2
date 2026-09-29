// ─────────────────────────────────────────────────────────────────────────
//  10 · priceLabel (a .then chain)                         ★☆☆ warm-up
//  concepts: .then · return values · promise adoption
//  run: node 10-then-chain.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Build a four-link chain with .then only — no async/await yet.
//
//      priceLabel('mug')   → '$16.50'
//      priceLabel('tee')   → '$33.00'
//
//  The steps, in order: fetchCents(sku) → add 10% tax (round it) →
//  toUsd(cents) → format as `$` plus dollars with two decimals.
//
//  The point: whatever a .then handler RETURNS becomes the input of the
//  next .then. Return a plain number and the next step gets a number.
//  Return a promise — toUsd does — and the chain waits for it and hands
//  the next step the resolved value, not the promise.

import { test, eq, ok, rejects } from '../../_lib/check.js';

const CENTS = { mug: 1000, tee: 2000 };

export function fetchCents(sku) {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      if (!(sku in CENTS)) reject(new Error(`unknown sku ${sku}`));
      else resolve(CENTS[sku]);
    }, 5)
  );
}

// Returns a PROMISE — the chain has to wait for it.
export function toUsd(cents) {
  return new Promise((resolve) => setTimeout(() => resolve(cents * 1.5), 5));
}

export function priceLabel(sku) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('runs every step in order', async () => {
  eq(await priceLabel('mug'), '$16.50');
});

test('works for another sku', async () => {
  eq(await priceLabel('tee'), '$33.00');
});

test('returns a promise, not the finished string', () => {
  ok(priceLabel('mug') instanceof Promise);
});

test('unwraps the promise toUsd returns', async () => {
  const label = await priceLabel('mug');
  ok(typeof label === 'string', `got ${typeof label} — did a step return?`);
});

test('a failure in step one rejects the whole chain', async () => {
  await rejects(priceLabel('nope'), 'unknown sku nope');
});
