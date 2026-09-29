// ─────────────────────────────────────────────────────────────────────────
//  02 · drain a cursor-paginated API — SOLUTION                 ★★☆ core
//  concepts: cursor pagination · async iteration · aggregation
//  run: node 02-paginate-cursors.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  A while loop over an opaque cursor: start undefined, call the page,
//  collect items, and let nextCursor decide whether to continue. The
//  discipline is trusting the cursor as the ONLY signal of "more" —
//  never a page count, never "stop when items.length < pageSize" (a full
//  final page whose nextCursor is null would fool that, and a short
//  non-final page would end you early). null means done; anything else
//  means keep going.
//  This is the read side of exercise 03 in module 27 — the server offers
//  keyset/cursor pagination, and the client's job is to follow it to
//  exhaustion without assuming its internals (the cursor might be an id,
//  an offset, or an encoded token; you neither know nor care).
//  For huge result sets, prefer an async generator that YIELDS each page
//  so the caller processes as it goes instead of buffering everything —
//  same loop, `yield items` instead of `push`.

import { test, eq } from '../../_lib/check.js';

export async function fetchAll(fetchPage) {
  const all = [];
  let cursor = undefined;
  do {
    const { items, nextCursor } = await fetchPage(cursor);
    all.push(...items);
    cursor = nextCursor;
  } while (cursor !== null);
  return all;
}

function pagedApi(items, size) {
  const calls = [];
  const fetchPage = async (cursor) => {
    const start = cursor ?? 0;
    calls.push(cursor);
    const slice = items.slice(start, start + size);
    const next = start + size < items.length ? start + size : null;
    return { items: slice, nextCursor: next };
  };
  fetchPage.calls = calls;
  return fetchPage;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a single-page result returns its items', async () => {
  const api = pagedApi([1, 2, 3], 10);
  eq(await fetchAll(api), [1, 2, 3]);
});

test('it follows cursors across several pages, in order', async () => {
  const api = pagedApi([1, 2, 3, 4, 5, 6, 7], 3);
  eq(await fetchAll(api), [1, 2, 3, 4, 5, 6, 7]);
});

test('it starts from an undefined cursor', async () => {
  const api = pagedApi([1, 2, 3, 4], 2);
  await fetchAll(api);
  eq(api.calls[0], undefined);
});

test('it stops exactly when nextCursor is null (no extra call)', async () => {
  const api = pagedApi([1, 2, 3, 4], 2);
  await fetchAll(api);
  eq(api.calls.length, 2);
});

test('an empty first page yields nothing', async () => {
  const api = pagedApi([], 5);
  eq(await fetchAll(api), []);
});
