// ─────────────────────────────────────────────────────────────────────────
//  29 · buffer — SOLUTION                                      ★★☆ core
//  run: node 29-buffer-async.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `for await` over the source, push into a batch, and
//  yield the moment it is full. The `if (batch.length > 0)` after the
//  loop is the whole edge case — without it the last few rows of every
//  import quietly disappear, and the bug only shows up when the row
//  count is not a multiple of the batch size.
//
//  `batch = []` rather than `batch.length = 0` is the other half.
//  Emptying the array in place hands every consumer the SAME array, so
//  the batches they collected all end up holding the final contents —
//  a bug that looks like data corruption and is really aliasing.
//
//  Laziness carries over from the sync case unchanged: yield suspends
//  the whole async generator, so the source is not pulled again until
//  someone asks for the next batch. That is what makes this safe on an
//  endless stream and on a paged API alike.

import { test, eq, ok } from '../../_lib/check.js';

// scaffolding: async sources that use microtasks instead of timers, a
// counting source, and the consumers from exercise 13. Do not edit.
async function* asyncOf(values) {
  for (const value of values) {
    await null;
    yield value;
  }
}

async function* asyncNaturals() {
  let n = 1;
  while (true) {
    await null;
    yield n;
    n += 1;
  }
}

function countedAsync(values) {
  const log = { pulls: 0 };
  const iterable = {
    [Symbol.asyncIterator]() {
      const inner = values[Symbol.iterator]();
      return {
        async next() {
          log.pulls += 1;
          return inner.next();
        },
      };
    },
  };
  return { iterable, log };
}

async function collectAsync(asyncIterable) {
  const out = [];
  for await (const value of asyncIterable) out.push(value);
  return out;
}

async function* takeAsync(n, asyncIterable) {
  if (n <= 0) return;
  let taken = 0;
  for await (const value of asyncIterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

export async function* buffer(source, size) {
  let batch = [];
  for await (const value of source) {
    batch.push(value);
    if (batch.length >= size) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) yield batch;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it hands out fixed-size batches', async () => {
  eq(await collectAsync(buffer(asyncOf([1, 2, 3, 4, 5, 6]), 3)), [
    [1, 2, 3],
    [4, 5, 6],
  ]);
});

test('the short last batch is not dropped', async () => {
  eq(await collectAsync(buffer(asyncOf([1, 2, 3, 4, 5, 6, 7]), 3)), [
    [1, 2, 3],
    [4, 5, 6],
    [7],
  ]);
});

test('a source smaller than the batch is one batch', async () => {
  eq(await collectAsync(buffer(asyncOf(['a']), 5)), [['a']]);
});

test('an empty source yields no batches at all', async () => {
  eq(await collectAsync(buffer(asyncOf([]), 3)), []);
});

test('a size of one gives one value per batch', async () => {
  eq(await collectAsync(buffer(asyncOf([1, 2]), 1)), [[1], [2]]);
});

test('every batch is a fresh array the consumer may keep', async () => {
  const batches = await collectAsync(buffer(asyncOf([1, 2, 3, 4]), 2));
  batches[0].push(999);
  eq(batches[1], [3, 4], 'the batches must not share one array');
  eq(batches[0], [1, 2, 999]);
});

test('it pulls only enough to fill the batch it was asked for', async () => {
  const src = countedAsync([1, 2, 3, 4, 5, 6, 7, 8]);
  const first = await buffer(src.iterable, 2).next();
  eq(first.value, [1, 2]);
  ok(src.log.pulls <= 3, `pulled ${src.log.pulls} values for one batch of 2`);
});

test('it batches an endless source', async () => {
  eq(await collectAsync(takeAsync(2, buffer(asyncNaturals(), 3))), [
    [1, 2, 3],
    [4, 5, 6],
  ]);
});
