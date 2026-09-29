// ─────────────────────────────────────────────────────────────────────────
//  38 · partitionSettled (read the report)                 ★☆☆ warm-up
//  concepts: allSettled · array shaping · error reporting
//  run: node 38-partition-settled.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `Promise.allSettled` never rejects — it hands you a mixed array and
//  leaves the reading to you. Turn that array into a report:
//
//      partitionSettled([
//        { status: 'fulfilled', value: 'a.png' },
//        { status: 'rejected',  reason: err },
//      ])
//      → { ok: ['a.png'], failed: [{ index: 1, reason: err }] }
//
//  Rules:
//    · `ok` holds the fulfilled VALUES, in input order
//    · `failed` holds `{ index, reason }` — the ORIGINAL array index, and
//      the reason object itself (not its message)
//    · an empty input gives `{ ok: [], failed: [] }`

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
  throw new Error('TODO');
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
