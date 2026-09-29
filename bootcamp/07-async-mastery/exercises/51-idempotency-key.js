// ─────────────────────────────────────────────────────────────────────────
//  51 · withIdempotency (same key, same answer)             ★★☆ core
//  concepts: idempotency · result caching · safe retries
//  run: node 51-idempotency-key.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The client's connection dropped, so it retries `POST /charge` with the
//  same `Idempotency-Key`. Charging twice is a bug; making the retry wait
//  for the first charge and then handing back its result is correct.
//  Build `withIdempotency(fn)` → `(key, ...args)`:
//
//      const pay = withIdempotency(charge);
//      const a = pay('k1', 100);
//      const b = pay('k1', 100);   → a === b, charge called ONCE
//      await a; await pay('k1', 100)  → the stored result, still one call
//
//  Rules:
//    · while a key is in flight, every caller gets the SAME promise
//    · after it FULFILS the result is remembered — a replay never calls
//      `fn` again
//    · after it REJECTS the key is forgotten, so a real retry can happen
//    · different keys never share
//
//  hint: this is exercise 35 with one line changed. Work out which line,
//  and why "successes stick, failures do not" is the whole contract.

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
  throw new Error('TODO');
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
