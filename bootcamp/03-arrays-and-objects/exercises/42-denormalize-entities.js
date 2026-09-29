// ─────────────────────────────────────────────────────────────────────────
//  42 · denormalize back into a tree                       ★★☆ core
//  concepts: hydrating id lists · dangling references · round trips
//  run: node 42-denormalize-entities.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Normalized state is great to store and unreadable to render. Going back
//  the other way means turning every id list into the objects it points at
//  — and deciding what to do when an id points at nothing.
//
//      hydrate(['b3', 'b1'], STATE.books.byId)  → [Ubik, Dune]
//      denormalize(STATE)
//        → [ { id: 's1', name: 'Sci-fi', books: [Dune, Ubik] }, … ]
//      renormalize(denormalize(STATE))          → the two tables again
//
//  A shelf keeps `books` instead of `bookIds`. Ids with no entity behind
//  them are dropped, not rendered as `undefined`, and a book on two
//  shelves is stored once.
//
//  hint: `map` then `filter` is the whole of `hydrate`. In `renormalize`,
//  rest destructuring peels the nested array off the shelf.

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
  throw new Error('TODO');
}

export function denormalize(state) {
  throw new Error('TODO');
}

export function renormalize(shelves) {
  throw new Error('TODO');
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
