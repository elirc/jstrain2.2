// ─────────────────────────────────────────────────────────────────────────
//  20 · memoize by object identity — SOLUTION                ★★☆ core
//  run: node 20-memoize-identity.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three details carry this whole exercise.
//  (1) `cache.has(arg)` rather than `if (cache.get(arg))` — otherwise a
//      result of undefined, 0, '' or false is recomputed forever, which is
//      the single most common memoisation bug.
//  (2) The key is the object itself, so "same input" means the SAME
//      reference. `{ ...cart }` is a different cart as far as the cache is
//      concerned. That is a feature: it is the only equality check that is
//      both free and always correct.
//  (3) WeakMap over Map, so an entry dies with its key. A Map here is a
//      memory leak with a nice API — it holds every object you ever passed
//      alive for the lifetime of the memoized function.
//  The guard has to accept functions and reject null, which is exactly
//  where `typeof` is at its most annoying.

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

const canBeKey = (value) =>
  typeof value === 'function' || (typeof value === 'object' && value !== null);

export function memoizeByIdentity(fn) {
  const cache = new WeakMap();
  return (arg) => {
    if (!canBeKey(arg)) throw new TypeError('memoize needs an object');
    if (cache.has(arg)) return cache.get(arg);
    const value = fn(arg);
    cache.set(arg, value);
    return value;
  };
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
