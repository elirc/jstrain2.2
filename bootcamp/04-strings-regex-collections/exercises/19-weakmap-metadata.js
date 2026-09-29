// ─────────────────────────────────────────────────────────────────────────
//  19 · WeakMap: metadata and memoizing                      ★★★ stretch
//  concepts: WeakMap · object identity · memoization · garbage collection
//  run: node 19-weakmap-metadata.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A WeakMap maps OBJECTS to values without owning them: it holds its
//  keys weakly, so an entry disappears when the key object does. That
//  makes it the right tool for two jobs.
//
//  1) Side-channel metadata — data about an object that must not appear
//     on the object (no extra property, invisible to Object.keys and
//     JSON.stringify, no name collisions):
//
//         const store = createMetaStore();
//         store.set(req, { startedAt: 5 });
//         store.get(req)      → { startedAt: 5 }
//         Object.keys(req)    → []           (untouched)
//         store.get(other)    → undefined
//
//  2) Memoizing by object identity — cache a computed result per object,
//     and let it be collected with the object:
//
//         const memo = memoizeByObject(expensive);
//         memo(user); memo(user)   → expensive ran ONCE
//         memo({ ...user })        → runs again (different object)
//
//  A WeakMap has get/set/has/delete only — no size, no iteration. That
//  is the price of weakness, and it is fine for both jobs.
//
//  hint: memoizeByObject returns a function that closes over one
//  WeakMap; check has() before calling fn, because a cached value of
//  undefined must not trigger a recompute.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function createMetaStore() {
  throw new Error('TODO');
}

export function memoizeByObject(fn) {
  throw new Error('TODO');
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
