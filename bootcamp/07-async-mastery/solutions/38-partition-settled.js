// ─────────────────────────────────────────────────────────────────────────
//  38 · partitionSettled (read the report) — SOLUTION      ★☆☆ warm-up
//  run: node 38-partition-settled.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: one pass with the index in hand. `forEach`/`reduce` both
//  work; what matters is that you keep the INDEX, because an allSettled
//  array is positional — entry 3 is input 3 — and that link is the only
//  way to say WHICH upload failed once the values are separated.
//  Keep `reason` as the Error object rather than `reason.message`. The
//  caller may want `.code`, `.cause` or the stack, and you cannot get any
//  of that back from a string. Flatten to messages only at the edge where
//  you actually print.
//  `allSettled` plus a partition is the shape you want whenever partial
//  success is useful: 47 uploads worked, 3 did not, and the 47 should not
//  be thrown away because of the 3 — which is exactly what `Promise.all`
//  would have done.
//  Wrong turn: `settled.filter(s => s.status === 'rejected')` alone. It
//  loses the position, so your log says "3 failed" and nothing else.

import { test, eq, ok, sleep } from '../../_lib/check.js';

// Uploads that succeed or fail on purpose, so one test can run the real
// Promise.allSettled instead of a hand-written fixture.
export const upload = (name, ms = 10) =>
  name.startsWith('bad')
    ? sleep(ms).then(() => {
        throw new Error(`upload failed: ${name}`);
      })
    : sleep(ms).then(() => `${name}.png`);

export function partitionSettled(settled) {
  const values = [];
  const failed = [];
  settled.forEach((entry, index) => {
    if (entry.status === 'fulfilled') values.push(entry.value);
    else failed.push({ index, reason: entry.reason });
  });
  return { ok: values, failed };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('splits a mixed array into values and failures', () => {
  const boom = new Error('nope');
  eq(
    partitionSettled([
      { status: 'fulfilled', value: 'a' },
      { status: 'rejected', reason: boom },
    ]),
    { ok: ['a'], failed: [{ index: 1, reason: boom }] }
  );
});

test('keeps input order in both lists', () => {
  const first = new Error('1');
  const second = new Error('2');
  const out = partitionSettled([
    { status: 'rejected', reason: first },
    { status: 'fulfilled', value: 'x' },
    { status: 'rejected', reason: second },
    { status: 'fulfilled', value: 'y' },
  ]);
  eq(out.ok, ['x', 'y']);
  eq(
    out.failed.map((f) => f.index),
    [0, 2]
  );
});

test('keeps the reason object itself, not its message', () => {
  const boom = new Error('nope');
  const out = partitionSettled([{ status: 'rejected', reason: boom }]);
  ok(out.failed[0].reason === boom, 'hand back the Error you were given');
});

test('an all-fulfilled array has nothing in failed', () => {
  const out = partitionSettled([
    { status: 'fulfilled', value: 1 },
    { status: 'fulfilled', value: 2 },
  ]);
  eq(out, { ok: [1, 2], failed: [] });
});

test('an empty input gives two empty lists', () => {
  eq(partitionSettled([]), { ok: [], failed: [] });
});

test('reads a real Promise.allSettled result', async () => {
  const names = ['one', 'bad-two', 'three'];
  const settled = await Promise.allSettled(names.map((n) => upload(n)));
  const out = partitionSettled(settled);
  eq(out.ok, ['one.png', 'three.png']);
  eq(out.failed.length, 1);
  eq(out.failed[0].index, 1);
  eq(out.failed[0].reason.message, 'upload failed: bad-two');
});
