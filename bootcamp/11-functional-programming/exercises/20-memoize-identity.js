// ─────────────────────────────────────────────────────────────────────────
//  20 · memoize by object identity                           ★★☆ core
//  concepts: memoisation · WeakMap · referential identity
//  run: node 20-memoize-identity.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Pure functions can be cached, because the same input always gives the
//  same answer. When the input is an OBJECT the cheapest possible cache key
//  is the object itself — no serialising, no hashing — and a WeakMap lets
//  the entry disappear when the object does, so the cache cannot leak.
//
//      const totalOf = memoizeByIdentity(expensiveTotal);
//      totalOf(cart);   // computes
//      totalOf(cart);   // same object → cached, expensiveTotal not called
//      totalOf({ ...cart });  // a DIFFERENT object → computes again
//
//  memoizeByIdentity(fn) returns a one-argument function that:
//    · caches on the argument's identity, in a WeakMap
//    · returns the cached value — the same reference, every time
//    · caches an `undefined` result just as happily as any other
//    · throws TypeError('memoize needs an object') when handed a
//      primitive — null included, arrays and functions excluded
//
//  hint: `typeof null` is 'object' and `typeof fn` is 'function'. A plain
//  `typeof arg === 'object'` guard gets both of those wrong.

import { test, eq, ok, throws, spy } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

const cart = deepFreeze({
  lines: [
    { sku: 'mug', qty: 2, price: 12 },
    { sku: 'pen', qty: 3, price: 1 },
  ],
});

const total = (cart) =>
  cart.lines.reduce((sum, line) => sum + line.qty * line.price, 0);

export function memoizeByIdentity(fn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the first call computes and the second is served from cache', () => {
  const work = spy(total);
  const totalOf = memoizeByIdentity(work);
  eq(totalOf(cart), 27);
  eq(totalOf(cart), 27);
  eq(work.callCount, 1);
});

test('the cached value keeps its reference', () => {
  const summarise = memoizeByIdentity((c) => ({ count: c.lines.length }));
  ok(summarise(cart) === summarise(cart), 'one object, handed out twice');
});

test('an equal-but-distinct object is a different key', () => {
  const work = spy(total);
  const totalOf = memoizeByIdentity(work);
  totalOf(cart);
  totalOf({ ...cart });
  eq(work.callCount, 2);
});

test('two objects each keep their own entry, however interleaved', () => {
  const work = spy(total);
  const totalOf = memoizeByIdentity(work);
  const other = deepFreeze({ lines: [{ sku: 'ink', qty: 1, price: 5 }] });
  eq(totalOf(cart), 27);
  eq(totalOf(other), 5);
  eq(totalOf(cart), 27);
  eq(totalOf(other), 5);
  eq(work.callCount, 2);
});

test('an undefined result is still a cached result', () => {
  const work = spy(() => undefined);
  const lookup = memoizeByIdentity(work);
  eq(lookup(cart), undefined);
  eq(lookup(cart), undefined);
  eq(work.callCount, 1, 'the cache must ask "have I seen this key?"');
});

test('arrays and functions are objects too', () => {
  const work = spy((v) => (Array.isArray(v) ? v.length : v.name));
  const describe = memoizeByIdentity(work);
  const list = [1, 2, 3];
  const handler = function submit() {};
  eq(describe(list), 3);
  eq(describe(list), 3);
  eq(describe(handler), 'submit');
  eq(describe(handler), 'submit');
  eq(work.callCount, 2);
});

test('primitives — and null — are refused', () => {
  const upper = memoizeByIdentity((s) => String(s).toUpperCase());
  throws(() => upper('ada'), 'memoize needs an object');
  throws(() => upper(42), 'memoize needs an object');
  throws(() => upper(null), 'memoize needs an object');
});

test('each memoized function gets a cache of its own', () => {
  const a = spy(() => 'a');
  const b = spy(() => 'b');
  const first = memoizeByIdentity(a);
  const second = memoizeByIdentity(b);
  eq(first(cart), 'a');
  eq(second(cart), 'b');
  eq(a.callCount, 1);
  eq(b.callCount, 1);
});
