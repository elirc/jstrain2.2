// ─────────────────────────────────────────────────────────────────────────
//  13 · ticker · collectAsync · takeAsync                  ★★★ stretch
//  concepts: async function* · for await...of
//  run: node 13-async-generator.js
// ─────────────────────────────────────────────────────────────────────────
//
//  An async generator yields values that arrive over TIME — each pull
//  hands back a promise. `for await (const x of source)` awaits every
//  step for you. Same protocol as before, one Symbol along:
//  [Symbol.asyncIterator] instead of [Symbol.iterator].
//
//      ticker(['a','b'], 5)   an async generator: wait 5ms, yield 'a',
//                             wait 5ms, yield 'b'
//
//      await collectAsync(ticker(['a','b'], 5))   → ['a', 'b']
//      await collectAsync(takeAsync(2, endless))  → 2 values, then stop
//
//  collectAsync drains any async iterable into an array. takeAsync is
//  exercise 07's take, async — and it must stop pulling, so an endless
//  source does not run forever.
//
//  hint: `async function*` bodies can `await` between yields, and
//        `for await` is legal inside them

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
  throw new Error('TODO');
}

export async function collectAsync(asyncIterable) {
  throw new Error('TODO');
}

export async function* takeAsync(n, asyncIterable) {
  throw new Error('TODO');
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
