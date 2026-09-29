// ─────────────────────────────────────────────────────────────────────────
//  37 · autocomplete: top suggestions                       ★★★ stretch
//  concepts: tries · subtree collection · ranking
//  run: node 37-trie-autocomplete.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A search box does not want "every word starting with ca" — it wants the
//  best few, ranked by how often people actually search for them. Store a
//  count on each word's final node, then collect the SUBTREE under the
//  typed prefix and rank what you find.
//
//      box.insert('car', 50); box.insert('care', 20);
//      box.insert('cart', 20); box.insert('cardigan', 5);
//      box.suggest('ca')      → ['car', 'care', 'cart', 'cardigan']
//      box.suggest('ca', 2)   → ['car', 'care']
//      box.suggest('zz')      → []
//
//  insert(word, count = 1) ADDS to the word's count, so inserting twice
//  makes it more popular. suggest(prefix, limit = 5) returns at most
//  `limit` words, most popular first, ties broken alphabetically.
//  Each node is { children: Map, count: number } — count 0 means "this is
//  a path, not a word".
//
//  hint: walk to the prefix node first (bail out early if it is missing),
//  then depth-first from there, building each word as you descend

import { test, eq } from '../../_lib/check.js';

export class Autocomplete {
  constructor() {
    this.root = { children: new Map(), count: 0 };
  }

  insert(word, count = 1) {
    throw new Error('TODO');
  }

  suggest(prefix, limit = 5) {
    throw new Error('TODO');
  }
}

const dictionary = () => {
  const box = new Autocomplete();
  box.insert('car', 50);
  box.insert('cart', 20);
  box.insert('care', 20);
  box.insert('cardigan', 5);
  box.insert('dog', 90);
  return box;
};

// ──────────────────────────── tests ──────────────────────────────────────

test('suggestions come back most popular first', () => {
  const box = dictionary();
  eq(box.suggest('ca'), ['car', 'care', 'cart', 'cardigan']);
});

test('ties fall back to alphabetical order', () => {
  const box = dictionary();
  const hits = box.suggest('ca');
  eq([hits[1], hits[2]], ['care', 'cart'], 'both scored 20');
});

test('an unknown prefix suggests nothing', () => {
  const box = dictionary();
  eq(box.suggest('zz'), []);
  eq(box.suggest('cars'), [], 'no word continues past this path');
  eq(new Autocomplete().suggest('a'), []);
});

test('the limit truncates, and a generous limit returns everything', () => {
  const box = dictionary();
  eq(box.suggest('ca', 2), ['car', 'care']);
  eq(box.suggest('ca', 1), ['car']);
  eq(box.suggest('ca', 99).length, 4);
});

test('inserting a word again raises its rank', () => {
  const box = dictionary();
  box.insert('cart', 100);
  eq(box.suggest('ca', 1), ['cart'], '20 + 100 now beats car at 50');
});

test('the prefix itself is suggested when it is a stored word', () => {
  const box = dictionary();
  eq(box.suggest('car')[0], 'car');
  eq(box.suggest('car').length, 4, 'car, care, cart, cardigan');
});

test('the empty prefix ranks the whole dictionary', () => {
  const box = dictionary();
  eq(box.suggest('', 2), ['dog', 'car']);
  eq(box.suggest('', 99).length, 5);
});

test('application: a search box ranks car above cardigan', () => {
  const box = new Autocomplete();
  for (const [term, hits] of [
    ['car', 900],
    ['cardigan', 12],
    ['carpet', 300],
    ['camera', 450],
  ]) {
    box.insert(term, hits);
  }
  eq(box.suggest('car', 3), ['car', 'carpet', 'cardigan']);
  eq(box.suggest('ca', 2), ['car', 'camera']);
});
