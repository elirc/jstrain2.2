// ─────────────────────────────────────────────────────────────────────────
//  04 · idempotency keys — charge once                       ★★★ stretch
//  concepts: idempotency · dedupe · safe retries
//  run: node 04-idempotency-key.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Retrying a POST is dangerous: if the first request succeeded but its
//  response was lost, the retry charges the customer twice. The fix is an
//  idempotency key — the client sends the SAME key for a logical
//  operation, and the server does the work at most once per key,
//  returning the stored result to any repeat.
//
//  Build makeChargeService(perform) returning { charge(key, amountCents) }:
//    · first time a key is seen → call perform(amountCents), STORE and
//      return its result
//    · same key again → return the STORED result, do NOT call perform
//    · different keys are independent operations
//
//      charge('k1', 500) → performs, returns receipt A
//      charge('k1', 500) → returns receipt A again, perform NOT called
//      charge('k2', 500) → performs again (new key)
//
//  hint: a Map from key → result. Check it before doing the work; if the
//  key is present, short-circuit. The amount is not the key — the client
//  supplies the key precisely so a retry is recognizable.

import { test, eq } from '../../_lib/check.js';

export function makeChargeService(perform) {
  throw new Error('TODO');
}

// ── a perform() that mints a unique receipt and counts its calls ─────────
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
  eq(again, first); // same receipt
  eq(perform.callCount(), 1); // performed once
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
  eq(b.receiptId, 'r1'); // svc2 has its own store; not shared with svc1
});
