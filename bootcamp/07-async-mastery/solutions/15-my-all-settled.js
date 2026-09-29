// ─────────────────────────────────────────────────────────────────────────
//  15 · myAllSettled — SOLUTION                            ★★★ stretch
//  run: node 15-my-all-settled.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: structurally this is myPromiseAll with the rejection
//  path redirected. Instead of calling reject, the error handler writes
//  { status: 'rejected', reason } into the same slot and decrements the
//  same counter, so the outer promise only ever fulfils.
//  This is the combinator you actually want for "fan out to 20 services
//  and show me what came back" — Promise.all would throw away 19 good
//  results because one service was down.
//  Wrong turn: forgetting that a rejected input still counts toward the
//  countdown; the promise then hangs forever.

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
  const list = [...items];
  return new Promise((resolve) => {
    const out = new Array(list.length);
    let left = list.length;
    if (left === 0) {
      resolve([]);
      return;
    }
    const done = (i, record) => {
      out[i] = record;
      left -= 1;
      if (left === 0) resolve(out);
    };
    list.forEach((item, i) => {
      Promise.resolve(item).then(
        (value) => done(i, { status: 'fulfilled', value }),
        (reason) => done(i, { status: 'rejected', reason })
      );
    });
  });
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
