// ─────────────────────────────────────────────────────────────────────────
//  02 · drain a cursor-paginated API                            ★★☆ core
//  concepts: cursor pagination · async iteration · aggregation
//  run: node 02-paginate-cursors.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A list endpoint returns one page plus a cursor to the next:
//
//      fetchPage(cursor) → { items: [...], nextCursor: 'abc' | null }
//
//  A null nextCursor means "last page". Build fetchAll(fetchPage) that
//  follows the cursors from the start (cursor undefined) and returns
//  every item, in order, across all pages.
//
//      one page,   nextCursor null      → those items
//      three pages, cursors then null   → all items concatenated
//
//  hint: start with cursor undefined; loop calling fetchPage(cursor),
//  push items, set cursor = nextCursor, stop when it's null. Do NOT
//  assume a page count — the cursor is the only authority on "more".

import { test, eq } from '../../_lib/check.js';

export async function fetchAll(fetchPage) {
  throw new Error('TODO');
}

// ── a fake API: pages of `size`, cursor is the next offset ───────────────
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
  const api = pagedApi([1, 2, 3, 4], 2); // 2 pages, second has next=null
  await fetchAll(api);
  eq(api.calls.length, 2);
});

test('an empty first page yields nothing', async () => {
  const api = pagedApi([], 5);
  eq(await fetchAll(api), []);
});
