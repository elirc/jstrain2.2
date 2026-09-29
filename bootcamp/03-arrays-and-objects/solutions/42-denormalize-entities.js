// ─────────────────────────────────────────────────────────────────────────
//  42 · denormalize back into a tree — SOLUTION            ★★☆ core
//  run: node 42-denormalize-entities.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: hydrating is `ids.map(id => byId[id])`, and the `.filter`
//  after it is the whole difference between a robust cache and a screen
//  full of "Cannot read properties of undefined". Dangling ids are normal:
//  the book was deleted, the shelf was not updated, and the reference
//  outlived the row. `denormalize` peels `bookIds` off with rest
//  destructuring so the rendered shelf carries `books` and nothing stale.
//  Going back, `renormalize` has to DEDUPE — the same book object can hang
//  off two shelves, and the entity table is supposed to store it once. That
//  asymmetry (a tree can repeat a node, a table cannot) is exactly why the
//  normalized form exists in the first place.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const STATE = deepFreeze({
  shelves: {
    byId: {
      s1: { id: 's1', name: 'Sci-fi',      bookIds: ['b1', 'b3'] },
      s2: { id: 's2', name: 'Poetry',      bookIds: [] },
      s3: { id: 's3', name: 'Staff picks', bookIds: ['b2', 'b9', 'b1'] },
    },
    allIds: ['s1', 's2', 's3'],
  },
  books: {
    byId: {
      b1: { id: 'b1', title: 'Dune' },
      b2: { id: 'b2', title: 'Solaris' },
      b3: { id: 'b3', title: 'Ubik' },
    },
    allIds: ['b1', 'b2', 'b3'],
  },
});

export function hydrate(ids, byId) {
  return ids.map((id) => byId[id]).filter((entity) => entity !== undefined);
}

export function denormalize(state) {
  return state.shelves.allIds.map((id) => {
    const { bookIds, ...shelf } = state.shelves.byId[id];
    return { ...shelf, books: hydrate(bookIds, state.books.byId) };
  });
}

export function renormalize(shelves) {
  const shelfTable = { byId: {}, allIds: [] };
  const bookTable = { byId: {}, allIds: [] };

  for (const { books, ...shelf } of shelves) {
    for (const book of books) {
      if (!Object.hasOwn(bookTable.byId, book.id)) bookTable.allIds.push(book.id);
      bookTable.byId[book.id] = book;
    }
    shelfTable.byId[shelf.id] = { ...shelf, bookIds: books.map((b) => b.id) };
    shelfTable.allIds.push(shelf.id);
  }

  return { shelves: shelfTable, books: bookTable };
}

// ──────────────────────────── tests ──────────────────────────────────────

const titles = (books) => books.map((b) => b.title);

test('hydrate resolves ids in the order it was given them', () => {
  eq(titles(hydrate(['b3', 'b1'], STATE.books.byId)), ['Ubik', 'Dune']);
});

test('hydrate drops ids with nothing behind them', () => {
  eq(hydrate(['b1', 'b9'], STATE.books.byId).length, 1);
  eq(hydrate([], STATE.books.byId), []);
});

test('denormalize nests the books under each shelf', () => {
  const shelves = denormalize(STATE);
  eq(shelves.map((s) => s.id), ['s1', 's2', 's3']);
  eq(titles(shelves[0].books), ['Dune', 'Ubik']);
});

test('a shelf swaps bookIds for books', () => {
  const shelves = denormalize(STATE);
  ok(!('bookIds' in shelves[0]));
  eq(shelves[0].name, 'Sci-fi');
});

test('an empty shelf gets an empty array, not undefined', () => {
  eq(denormalize(STATE)[1].books, []);
});

test('a dangling reference is skipped and the shelf survives', () => {
  eq(titles(denormalize(STATE)[2].books), ['Solaris', 'Dune']);
});

test('denormalize does not touch the frozen state', () => {
  denormalize(STATE);
  eq(STATE.shelves.byId.s1.bookIds, ['b1', 'b3']);
  ok(!('books' in STATE.shelves.byId.s1));
});

test('renormalize rebuilds both tables and stores a shared book once', () => {
  const tables = renormalize(denormalize(STATE));
  eq(tables.shelves.allIds, ['s1', 's2', 's3']);
  eq(tables.shelves.byId.s3.bookIds, ['b2', 'b1']);
  eq(tables.books.allIds, ['b1', 'b3', 'b2']);
  ok(!('books' in tables.shelves.byId.s1));
});
