// ─────────────────────────────────────────────────────────────────────────
//  04 · idempotency keys — charge once — SOLUTION            ★★★ stretch
//  concepts: idempotency · dedupe · safe retries
//  run: node 04-idempotency-key.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  A per-key memo over a side-effecting operation. The Map is checked
//  BEFORE performing: a seen key returns its stored result and never
//  touches perform, so a retried request is recognized by its key and
//  the charge happens exactly once. This is why the CLIENT generates the
//  key (a UUID per logical action) and resends the SAME one on retry —
//  the amount can't be the key, since two legitimate $5 charges must
//  stay distinct.
//  It pairs directly with exercise 01: retries make a flaky call
//  reliable, and idempotency makes those retries SAFE for non-idempotent
//  operations (payments, order creation, emails). Without the key, "retry
//  the POST" is how customers get charged twice.
//  Each service instance owns its own store (last test), matching a real
//  server that persists keys in a shared table with a TTL — long enough
//  to cover client retries, not forever. Classic wrong turns: keying on
//  request contents instead of a client key (two identical-looking
//  requests dedupe wrongly), or performing THEN storing without guarding
//  concurrent duplicates (two in-flight retries both miss the map).

import { test, eq } from '../../_lib/check.js';

export function makeChargeService(perform) {
  const seen = new Map();
  return {
    charge(key, amountCents) {
      if (seen.has(key)) return seen.get(key);
      const result = perform(amountCents);
      seen.set(key, result);
      return result;
    },
  };
}

function counter() {
  let n = 0;
  const perform = (amountCents) => {
    n += 1;
    return { receiptId: `r${n}`, amountCents };
  };
  perform.callCount = () => n;
  return perform;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the first charge performs the work', () => {
  const perform = counter();
  const svc = makeChargeService(perform);
  eq(svc.charge('k1', 500), { receiptId: 'r1', amountCents: 500 });
  eq(perform.callCount(), 1);
});

test('the same key returns the stored result without re-charging', () => {
  const perform = counter();
  const svc = makeChargeService(perform);
  const first = svc.charge('k1', 500);
  const again = svc.charge('k1', 500);
  eq(again, first);
  eq(perform.callCount(), 1);
});

test('a different key is a separate operation', () => {
  const perform = counter();
  const svc = makeChargeService(perform);
  svc.charge('k1', 500);
  const second = svc.charge('k2', 500);
  eq(second.receiptId, 'r2');
  eq(perform.callCount(), 2);
});

test('three retries of one key perform exactly once', () => {
  const perform = counter();
  const svc = makeChargeService(perform);
  const results = ['k9', 'k9', 'k9'].map((k) => svc.charge(k, 250));
  eq(perform.callCount(), 1);
  eq(results[0], results[1]);
  eq(results[1], results[2]);
});

test('keys are isolated per service instance', () => {
  const svc1 = makeChargeService(counter());
  const svc2 = makeChargeService(counter());
  const a = svc1.charge('k1', 100);
  const b = svc2.charge('k1', 100);
  eq(a.receiptId, 'r1');
  eq(b.receiptId, 'r1');
});
