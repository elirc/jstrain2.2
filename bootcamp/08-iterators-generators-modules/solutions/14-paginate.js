// ─────────────────────────────────────────────────────────────────────────
//  14 · paginate — SOLUTION                                ★★★ stretch
//  run: node 14-paginate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the loop is the same one you would have written by
//  hand — fetch, hand out the rows, follow the cursor — except that
//  `yield*` gives each row to the caller instead of pushing it into an
//  array that grows without limit. The caller decides how far the walk
//  goes; a `break` in their for-await closes this generator mid-page
//  and the next fetch never happens.
//
//  Watch the exit condition. `nextCursor === null` ends the walk, but
//  a falsy check (`if (!nextCursor)`) would also end it on cursor 0 —
//  the classic paging bug. Ending on `items.length === 0` instead is
//  wrong too: a sparse API can hand you an empty page in the middle.

import { test, eq, sleep } from '../../_lib/check.js';

// scaffolding: a fake paged API over an in-memory array, plus the
// async consumers from exercise 13. `calls` records every cursor the
// API was asked for. Do not edit.
function makeApi(items, pageSize) {
  const calls = [];
  async function fetchPage(cursor) {
    const at = cursor ?? 0;
    calls.push(at);
    await sleep(1);
    const next = at + pageSize;
    return {
      items: items.slice(at, next),
      nextCursor: next < items.length ? next : null,
    };
  }
  return { fetchPage, calls };
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

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

export async function* paginate(fetchPage) {
  let cursor;
  while (true) {
    const page = await fetchPage(cursor);
    yield* page.items;
    if (page.nextCursor === null || page.nextCursor === undefined) return;
    cursor = page.nextCursor;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it yields every item across every page', async () => {
  const api = makeApi(LETTERS, 3);
  eq(await collectAsync(paginate(api.fetchPage)), LETTERS);
});

test('it walks the cursors the API handed back', async () => {
  const api = makeApi(LETTERS, 3);
  await collectAsync(paginate(api.fetchPage));
  eq(api.calls, [0, 3, 6]);
});

test('nothing is fetched until the first pull', async () => {
  const api = makeApi(LETTERS, 3);
  const pages = paginate(api.fetchPage);
  eq(api.calls, [], 'creating the generator must not touch the API');
  await pages.next();
  eq(api.calls, [0]);
});

test('a consumer that stops early never fetches page two', async () => {
  const api = makeApi(LETTERS, 3);
  eq(await collectAsync(takeAsync(2, paginate(api.fetchPage))), ['a', 'b']);
  eq(api.calls, [0], 'page 2 was fetched but never needed');
});

test('it fetches the next page only when the consumer needs it', async () => {
  const api = makeApi(LETTERS, 3);
  const four = await collectAsync(takeAsync(4, paginate(api.fetchPage)));
  eq(four, ['a', 'b', 'c', 'd']);
  eq(api.calls, [0, 3]);
});

test('a single-page API costs one fetch', async () => {
  const api = makeApi(['x', 'y'], 10);
  eq(await collectAsync(paginate(api.fetchPage)), ['x', 'y']);
  eq(api.calls, [0]);
});

test('an empty API yields nothing and stops', async () => {
  const api = makeApi([], 3);
  eq(await collectAsync(paginate(api.fetchPage)), []);
  eq(api.calls, [0]);
});

test('it copes with a page size of one', async () => {
  const api = makeApi(['a', 'b', 'c'], 1);
  eq(await collectAsync(paginate(api.fetchPage)), ['a', 'b', 'c']);
  eq(api.calls, [0, 1, 2]);
});
