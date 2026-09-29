// ─────────────────────────────────────────────────────────────────────────
//  34 · cached getters                                     ★★★ stretch
//  concepts: derived state · memoisation · invalidation
//  run: node 34-cached-getters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A getter looks free at the call site, so callers use it in loops. Cache
//  the answer and you have signed up for the hard half: knowing when the
//  cached answer stopped being true.
//
//  Build a Basket of { name, price, quantity } lines. Prices are whole
//  cents, so totals stay exact.
//
//      const b = new Basket().add('tea', 250, 2).add('mug', 400);
//      b.total          → 900
//      b.total          → 900, WITHOUT adding it up again
//      b.add('pen', 50);
//      b.total          → 950  (the cache had to go)
//
//  Every mutation — add, remove, clear — invalidates. remove() returns
//  true/false for whether it removed anything, and a remove that finds
//  nothing must NOT throw the cache away. `items` hands back copies.
//
//  Bump `stats.computes` each time you really add the lines up; the tests
//  read it to see whether the cache worked.
//
//  hint: `null` means "nothing cached" — do not test the cache with
//  `if (!this.#total)`, because 0 is a perfectly good total

import { test, eq, ok } from '../../_lib/check.js';

export const stats = { computes: 0 };

export class Basket {
  #items = [];

  add(name, price, quantity = 1) {
    throw new Error('TODO');
  }

  remove(name) {
    throw new Error('TODO');
  }

  clear() {
    throw new Error('TODO');
  }

  get items() {
    throw new Error('TODO');
  }

  get count() {
    throw new Error('TODO');
  }

  get total() {
    throw new Error('TODO');
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('total adds up price times quantity', () => {
  const b = new Basket().add('tea', 250, 2).add('mug', 400);
  eq(b.total, 900);
  eq(b.count, 2);
});

test('reading total twice computes it once', () => {
  const b = new Basket().add('tea', 250);
  stats.computes = 0;
  eq(b.total, 250);
  eq(b.total, 250);
  eq(b.total, 250);
  eq(stats.computes, 1, 'the second and third reads came from the cache');
});

test('add throws the cache away', () => {
  const b = new Basket().add('tea', 250);
  eq(b.total, 250);
  stats.computes = 0;
  b.add('mug', 400);
  eq(b.total, 650);
  eq(stats.computes, 1);
});

test('remove and clear invalidate too — the paths people forget', () => {
  const b = new Basket().add('tea', 250).add('mug', 400);
  eq(b.total, 650);
  eq(b.remove('tea'), true);
  eq(b.total, 400, 'a stale 650 here is the classic cache bug');
  b.clear();
  eq(b.total, 0);
  eq(b.count, 0);
});

test('a remove that finds nothing keeps the cache', () => {
  const b = new Basket().add('tea', 250);
  eq(b.total, 250);
  stats.computes = 0;
  eq(b.remove('nope'), false);
  eq(b.total, 250);
  eq(stats.computes, 0, 'nothing changed, so nothing needs recomputing');
});

test('an empty basket totals 0 — and caches that', () => {
  const b = new Basket();
  stats.computes = 0;
  eq(b.total, 0);
  eq(b.total, 0);
  eq(stats.computes, 1, '0 is falsy: a truthiness check recomputes forever');
});

test('two baskets keep their own caches', () => {
  const a = new Basket().add('tea', 250);
  const b = new Basket().add('mug', 400);
  eq(a.total, 250);
  eq(b.total, 400);
  a.add('pen', 50);
  eq(a.total, 300);
  eq(b.total, 400, 'b was never touched');
});

test('items hands back copies, so callers cannot corrupt the cache', () => {
  const b = new Basket().add('tea', 250, 2);
  eq(b.total, 500);
  const snapshot = b.items;
  snapshot[0].quantity = 99;
  snapshot.push({ name: 'ghost', price: 1, quantity: 1 });
  eq(b.total, 500);
  eq(b.items[0].quantity, 2);
  ok(b.items !== b.items, 'a fresh copy every read');
});
