// ─────────────────────────────────────────────────────────────────────────
//  13 · ticker · collectAsync · takeAsync — SOLUTION       ★★★ stretch
//  run: node 13-async-generator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `async function*` is exactly the two features stacked
//  — await inside, yield outside. Each next() returns a promise of
//  { value, done }, and `for await` unwraps it, which is why
//  collectAsync reads like the sync version with two extra keywords.
//
//  takeAsync's `return` after the nth value matters even more than in
//  the sync case: an endless async source with a timer in it would
//  keep waking up forever. Returning from inside `for await` closes
//  the source generator, so its pending awaits are abandoned.
//
//  Classic wrong turn: `for (const x of asyncThing)` — a plain for-of
//  on an async iterable throws "is not iterable", because the values
//  live behind [Symbol.asyncIterator], not [Symbol.iterator].

import { test, eq, ok, sleep } from '../../_lib/check.js';

// scaffolding: other async sources to test against. Do not edit.
async function* asyncLetters() {
  yield 'x';
  await sleep(1);
  yield 'y';
}

async function* asyncNaturals() {
  let n = 1;
  while (true) {
    await sleep(1);
    yield n;
    n += 1;
  }
}

export async function* ticker(values, ms) {
  for (const value of values) {
    await sleep(ms);
    yield value;
  }
}

export async function collectAsync(asyncIterable) {
  const out = [];
  for await (const value of asyncIterable) out.push(value);
  return out;
}

export async function* takeAsync(n, asyncIterable) {
  if (n <= 0) return;
  let taken = 0;
  for await (const value of asyncIterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('collectAsync drains a ticker in order', async () => {
  eq(await collectAsync(ticker(['a', 'b', 'c'], 2)), ['a', 'b', 'c']);
});

test('the values really are spread out over time', async () => {
  const started = Date.now();
  await collectAsync(ticker([1, 2, 3], 5));
  ok(Date.now() - started >= 5, 'ticker should await between values');
});

test('a ticker with no values finishes immediately', async () => {
  eq(await collectAsync(ticker([], 5)), []);
});

test('collectAsync works on any async iterable', async () => {
  eq(await collectAsync(asyncLetters()), ['x', 'y']);
});

test('an async generator object is one-shot too', async () => {
  const g = ticker(['a', 'b'], 1);
  eq(await collectAsync(g), ['a', 'b']);
  eq(await collectAsync(g), []);
});

test('takeAsync stops an endless async source', async () => {
  eq(await collectAsync(takeAsync(3, asyncNaturals())), [1, 2, 3]);
});

test('takeAsync of 0 yields nothing', async () => {
  eq(await collectAsync(takeAsync(0, asyncNaturals())), []);
});

test('takeAsync of more than exists gives everything', async () => {
  eq(await collectAsync(takeAsync(9, ticker(['a'], 1))), ['a']);
});
