// ─────────────────────────────────────────────────────────────────────────
//  51 · withIdempotency (same key, same answer) — SOLUTION  ★★☆ core
//  run: node 51-idempotency-key.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a Map from key → promise, exactly like the in-flight
//  dedupe in exercise 35. The one line that differs is the cleanup: 35
//  used `.finally` and forgot the key on BOTH outcomes; here the cleanup
//  hangs off `.catch` only, so a fulfilled key stays in the Map forever
//  and a rejected one disappears.
//  That asymmetry IS the idempotency contract. A success must be
//  replayable — the client that never saw your 200 will ask again, and it
//  must get the same charge, not a second one. A failure must NOT be
//  replayable, because "the gateway timed out" is exactly the case where
//  the caller genuinely needs to try again.
//  Storing the PROMISE rather than the value is what covers the racy
//  window: the duplicate request usually arrives while the first is still
//  in flight, and a value-only cache is still empty at that moment.
//  Real systems add a TTL and persist the map (Stripe keeps keys 24h) —
//  an in-memory Map only protects one process, and it grows forever.
//  Wrong turn: caching the rejection too. Now the client can never retry
//  and a transient blip has become a permanent failure for that key.

import { test, eq, ok, rejects, spy } from '../../_lib/check.js';

// A payment gateway that fails its first `failures` attempts.
export function makeCharge({ failures = 0 } = {}) {
  const fn = spy(
    (amount) =>
      new Promise((resolve, reject) =>
        setTimeout(() => {
          fn.tries += 1;
          if (fn.tries <= failures) {
            reject(new Error(`gateway down (${fn.tries})`));
          } else {
            resolve(`charged:${amount}`);
          }
        }, 15)
      )
  );
  fn.tries = 0;
  return fn;
}

export function withIdempotency(fn) {
  const seen = new Map();

  return (key, ...args) => {
    const existing = seen.get(key);
    if (existing) return existing;

    const promise = Promise.resolve(fn(...args)).catch((err) => {
      seen.delete(key); // failures are retryable; successes are not
      throw err;
    });
    seen.set(key, promise);
    return promise;
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('concurrent replays share one promise and one call', async () => {
  const charge = makeCharge();
  const pay = withIdempotency(charge);
  const a = pay('k1', 100);
  const b = pay('k1', 100);
  ok(a === b, 'the replay must get the same promise object');
  eq(await Promise.all([a, b]), ['charged:100', 'charged:100']);
  eq(charge.callCount, 1);
});

test('a replay after success returns the stored result', async () => {
  const charge = makeCharge();
  const pay = withIdempotency(charge);
  eq(await pay('k1', 100), 'charged:100');
  eq(await pay('k1', 100), 'charged:100');
  eq(charge.callCount, 1, 'a settled key must not charge again');
});

test('the stored result wins even if the replay differs', async () => {
  const charge = makeCharge();
  const pay = withIdempotency(charge);
  eq(await pay('k1', 100), 'charged:100');
  eq(await pay('k1', 999), 'charged:100');
  eq(charge.callCount, 1);
});

test('different keys each get their own call', async () => {
  const charge = makeCharge();
  const pay = withIdempotency(charge);
  eq(await Promise.all([pay('k1', 10), pay('k2', 20)]), [
    'charged:10',
    'charged:20',
  ]);
  eq(charge.callCount, 2);
});

test('a rejection reaches every waiting caller', async () => {
  const charge = makeCharge({ failures: 99 });
  const pay = withIdempotency(charge);
  const a = pay('k1', 100);
  const b = pay('k1', 100);
  await rejects(a, 'gateway down');
  await rejects(b, 'gateway down');
  eq(charge.callCount, 1);
});

test('a failed key is forgotten so the retry really retries', async () => {
  const charge = makeCharge({ failures: 1 });
  const pay = withIdempotency(charge);
  await rejects(pay('k1', 100), 'gateway down (1)');
  eq(await pay('k1', 100), 'charged:100');
  eq(charge.callCount, 2);
  eq(await pay('k1', 100), 'charged:100');
  eq(charge.callCount, 2, 'and now the success sticks');
});
