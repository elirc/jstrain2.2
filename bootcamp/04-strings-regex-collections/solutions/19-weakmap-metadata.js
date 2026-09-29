// ─────────────────────────────────────────────────────────────────────────
//  19 · WeakMap: metadata and memoizing — SOLUTION           ★★★ stretch
//  run: node 19-weakmap-metadata.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both functions close over ONE WeakMap and expose only
//  what the caller needs — the map itself never escapes, so nobody can
//  enumerate it (a WeakMap cannot be iterated anyway).
//  createMetaStore keeps data ABOUT an object without touching it: no new
//  property, so Object.keys and JSON.stringify are unchanged and no key
//  can collide with the object's own fields. Keys are compared by
//  identity, so two look-alike objects get separate entries.
//  memoizeByObject caches per argument object. has() is checked before
//  get(), because a legitimately cached `undefined` must not look like a
//  cache miss — the classic wrong turn is `cache.get(o) ?? fn(o)`, which
//  recomputes forever for any falsy result.
//  Why weak? When the caller drops the object, the entry goes with it. A
//  Map here would pin every object it ever saw in memory — a leak that
//  only shows up in production.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createMetaStore() {
  const meta = new WeakMap();
  return {
    set(target, data) {
      meta.set(target, data);
    },
    get(target) {
      return meta.get(target);
    },
  };
}

export function memoizeByObject(fn) {
  const cache = new WeakMap();
  return (target) => {
    if (!cache.has(target)) cache.set(target, fn(target));
    return cache.get(target);
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the store remembers metadata per object', () => {
  const store = createMetaStore();
  const req = { url: '/a' };
  store.set(req, { startedAt: 5 });
  eq(store.get(req), { startedAt: 5 });
});

test('the object itself stays clean', () => {
  const store = createMetaStore();
  const req = { url: '/a' };
  store.set(req, { startedAt: 5 });
  eq(Object.keys(req), ['url']);
  eq(JSON.stringify(req), '{"url":"/a"}');
});

test('look-alike objects get separate metadata', () => {
  const store = createMetaStore();
  const a = { id: 1 };
  const b = { id: 1 };
  store.set(a, 'first');
  store.set(b, 'second');
  eq(store.get(a), 'first');
  eq(store.get(b), 'second');
});

test('get returns undefined for an unknown object', () => {
  const store = createMetaStore();
  eq(store.get({}), undefined);
});

test('memoize computes once per object', () => {
  const calc = spy((o) => o.n * 2);
  const memo = memoizeByObject(calc);
  const user = { n: 21 };
  eq(memo(user), 42);
  eq(memo(user), 42);
  eq(calc.callCount, 1);
});

test('memoize recomputes for a different object', () => {
  const calc = spy((o) => o.n * 2);
  const memo = memoizeByObject(calc);
  memo({ n: 1 });
  memo({ n: 1 });
  eq(calc.callCount, 2);
});

test('the cached value is the very same reference', () => {
  const memo = memoizeByObject((o) => ({ doubled: o.n * 2 }));
  const user = { n: 2 };
  ok(memo(user) === memo(user));
});

test('a cached undefined does not trigger a recompute', () => {
  const calc = spy(() => undefined);
  const memo = memoizeByObject(calc);
  const key = {};
  memo(key);
  memo(key);
  eq(calc.callCount, 1);
});
