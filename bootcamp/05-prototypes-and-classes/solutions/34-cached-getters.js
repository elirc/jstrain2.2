// ─────────────────────────────────────────────────────────────────────────
//  34 · cached getters — SOLUTION                          ★★★ stretch
//  run: node 34-cached-getters.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the cache itself is three lines — if #total is null,
//  compute and store; return it. Everything hard is invalidation. Every
//  method that can change #items has to null the cache, and missing ONE of
//  them (remove is the usual casualty) produces a stale number that no
//  test of the getter alone will catch. That is why the tests count
//  computations instead of trusting the value.
//
//  Two details make or break it. `null` is the empty marker, not
//  falsiness: an empty basket totals 0, and `if (!this.#total)` would
//  treat that valid answer as "not cached" and recompute on every read.
//  And the items getter returns copies of the line objects — hand out the
//  live ones and a caller can change a quantity behind the cache's back,
//  which is a mutation the class never sees and therefore never
//  invalidates.
//
//  remove() only invalidates when it actually removed something, which is
//  the small win that comes from routing every change through one method.

import { test, eq, ok } from '../../_lib/check.js';

export const stats = { computes: 0 };

export class Basket {
  #items = [];
  #total = null;

  add(name, price, quantity = 1) {
    this.#items.push({ name, price, quantity });
    this.#total = null;
    return this;
  }

  remove(name) {
    const at = this.#items.findIndex((item) => item.name === name);
    if (at === -1) return false;
    this.#items.splice(at, 1);
    this.#total = null;
    return true;
  }

  clear() {
    if (this.#items.length === 0) return this;
    this.#items = [];
    this.#total = null;
    return this;
  }

  get items() {
    return this.#items.map((item) => ({ ...item }));
  }

  get count() {
    return this.#items.length;
  }

  get total() {
    if (this.#total === null) {
      stats.computes += 1;
      this.#total = this.#items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }
    return this.#total;
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
