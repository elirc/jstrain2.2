// ─────────────────────────────────────────────────────────────────────────
//  25 · a paginated collection — SOLUTION                        ★★☆ core
//  concepts: iterator · Symbol.iterator · lazy fetching
//  run: node solutions/25-iterator-pagination.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough:
//  Intent — give callers one way to walk a collection without exposing
//  how it is stored, paged or fetched.
//  In JS the pattern has a protocol instead of an interface: anything
//  with `[Symbol.iterator]()` returning `{ next() }` works with
//  `for...of`, spread, destructuring, `Array.from` and `yield*`. Publish
//  it and your object joins the language.
//  A generator method is the honest implementation. It suspends at each
//  `yield`, so "fetch the next page" happens exactly when the consumer
//  asks for an item the current page cannot supply — laziness with no
//  state machine to hand-write. `break` runs the generator's `return()`,
//  which is why abandoning the loop also abandons the fetching.
//  The re-iterability rule is the classic trap: `[Symbol.iterator]()`
//  must return a FRESH iterator every call. Return `this` (or cache the
//  generator) and the second `for...of` sees an exhausted collection —
//  the bug where "the list renders once and then is empty".
//  When NOT to use: if the caller needs `length`, random access or
//  sorting, an iterator is the wrong shape — materialise an array.
//  Async sources want `Symbol.asyncIterator` and `for await`.
//  In the wild: Octokit's `paginate.iterator()`, AWS SDK v3
//  `paginateListObjectsV2`, Stripe's auto-paging lists, Mongo cursors,
//  `URLSearchParams`, `Map`/`Set` themselves.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createPagedCollection(fetchPage) {
  return {
    *[Symbol.iterator]() {
      let cursor = null;
      for (;;) {
        const page = fetchPage(cursor);
        yield* page.items;
        if (page.next === null || page.next === undefined) return;
        cursor = page.next;
      }
    },
  };
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
