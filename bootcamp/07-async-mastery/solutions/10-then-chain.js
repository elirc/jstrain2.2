// ─────────────────────────────────────────────────────────────────────────
//  10 · priceLabel (a .then chain) — SOLUTION              ★☆☆ warm-up
//  run: node 10-then-chain.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: each .then is one transform. The handler's return value
//  becomes the next link's argument, so the chain reads like a pipeline
//  instead of nesting like callbacks.
//  The interesting link is toUsd: it returns a PROMISE, and .then
//  adopts it — the chain pauses until it settles and passes the inner
//  value on. That flattening is why promises never nest: returning a
//  promise from a handler never gives you a promise of a promise.
//  Wrong turn: `.then((cents) => { toUsd(cents); })` — no return, so the
//  next step receives undefined and the chain does not wait.

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
  return fetchCents(sku)
    .then((cents) => cents + Math.round(cents * 0.1))
    .then((withTax) => toUsd(withTax))
    .then((usdCents) => `$${(usdCents / 100).toFixed(2)}`);
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
