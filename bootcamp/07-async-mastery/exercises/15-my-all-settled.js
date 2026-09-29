// ─────────────────────────────────────────────────────────────────────────
//  15 · myAllSettled                                       ★★★ stretch
//  concepts: combinators · settlement records · never rejecting
//  run: node 15-my-all-settled.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Promise.all is all-or-nothing. allSettled waits for everyone and
//  reports what happened to each — it never rejects.
//
//      await myAllSettled([after(5,'a'), failIn(5,'boom')])
//        → [{ status: 'fulfilled', value: 'a' },
//           { status: 'rejected', reason: Error('boom') }]
//
//      await myAllSettled([])   → []
//
//  Same index discipline as myPromiseAll: entry i describes input i,
//  whatever order things finish in. Use exactly those key names —
//  `status` + `value` for success, `status` + `reason` for failure.
//
//  hint: one .then with BOTH handlers, each writing a record to out[i]

import { test, eq, ok } from '../../_lib/check.js';

export const after = (ms, value) =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export const failIn = (ms, message) => {
  const p = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  p.catch(() => {}); // keeps an unfinished exercise from crashing Node
  return p;
};

export function myAllSettled(items) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('describes a fulfilled input', async () => {
  eq(await myAllSettled([after(5, 'a')]), [
    { status: 'fulfilled', value: 'a' },
  ]);
});

test('describes a rejected input', async () => {
  const [record] = await myAllSettled([failIn(5, 'boom')]);
  eq(record.status, 'rejected');
  ok(record.reason instanceof Error);
  eq(record.reason.message, 'boom');
});

test('never rejects, even when everything fails', async () => {
  const out = await myAllSettled([failIn(5, 'a'), failIn(10, 'b')]);
  eq(out.map((r) => r.status), ['rejected', 'rejected']);
});

test('keeps input order', async () => {
  const out = await myAllSettled([after(30, 'slow'), failIn(5, 'fast')]);
  eq(out[0], { status: 'fulfilled', value: 'slow' });
  eq(out[1].status, 'rejected');
});

test('resolves with [] for an empty list', async () => {
  eq(await myAllSettled([]), []);
});

test('accepts plain values', async () => {
  eq(await myAllSettled([7]), [{ status: 'fulfilled', value: 7 }]);
});
