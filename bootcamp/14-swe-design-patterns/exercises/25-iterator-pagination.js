// ─────────────────────────────────────────────────────────────────────────
//  25 · a paginated collection                                   ★★☆ core
//  concepts: iterator · Symbol.iterator · lazy fetching
//  run: node exercises/25-iterator-pagination.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The API hands you 3 records at a time plus a cursor for the next
//  page. Every caller then writes the same while-loop, and half of them
//  get the "one page too many" bug.
//
//  Wrap it in an aggregate that looks like any other collection:
//
//      const users = createPagedCollection(fetchPage);
//      for (const user of users) { ... }        // pages appear as needed
//      const [first, second] = users;           // one request, not three
//      [...users]                               // every record, in order
//
//  The API contract you are given:
//
//      fetchPage(cursor)  → { items: [...], next: cursorOrNull }
//      fetchPage(null)    → the first page
//
//  Nothing may be fetched until somebody actually starts iterating, and
//  a `break` must stop the fetching too. Two walks of the same
//  collection must each start from page one.
//
//  hint: `*[Symbol.iterator]() { ... }` — a generator method gives you
//  pause-and-resume for free, and `yield*` spreads a page's items

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createPagedCollection(fetchPage) {
  throw new Error('TODO');
}

const PAGES = {
  start: { items: ['a', 'b', 'c'], next: 'p2' },
  p2: { items: ['d', 'e', 'f'], next: 'p3' },
  p3: { items: ['g'], next: null },
};

const makeApi = () => spy((cursor) => PAGES[cursor ?? 'start']);

// ──────────────────────────── tests ──────────────────────────────────────

test('spreading walks every page in order', () => {
  const api = makeApi();
  const users = createPagedCollection(api);
  eq([...users], ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  eq(api.callCount, 3);
});

test('building the collection fetches nothing', () => {
  const api = makeApi();
  createPagedCollection(api);
  eq(api.callCount, 0);
});

test('two records cost one request', () => {
  const api = makeApi();
  const [first, second] = createPagedCollection(api);
  eq([first, second], ['a', 'b']);
  eq(api.callCount, 1);
});

test('break stops the walk and the fetching with it', () => {
  const api = makeApi();
  const seen = [];
  for (const item of createPagedCollection(api)) {
    seen.push(item);
    if (item === 'd') break;
  }
  eq(seen, ['a', 'b', 'c', 'd']);
  eq(api.callCount, 2);
});

test('the collection is re-iterable: each walk starts at page one', () => {
  const api = makeApi();
  const users = createPagedCollection(api);
  eq([...users].length, 7);
  eq([...users].length, 7);
  eq(api.callCount, 6);
});

test('an empty first page yields nothing', () => {
  const api = spy(() => ({ items: [], next: null }));
  eq([...createPagedCollection(api)], []);
  eq(api.callCount, 1);
});

test('every call to [Symbol.iterator]() is an independent cursor', () => {
  const users = createPagedCollection(makeApi());
  const one = users[Symbol.iterator]();
  const two = users[Symbol.iterator]();
  ok(one !== two, 'do not hand back the collection itself');
  eq(one.next().value, 'a');
  eq(two.next().value, 'a');
  eq(one.next().value, 'b');
  eq(two.next().value, 'b');
});
