// ─────────────────────────────────────────────────────────────────────────
//  28 · point-free reps — SOLUTION                           ★★☆ core
//  run: node 28-point-free.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: every combinator here has the same shape — take the
//  CONFIGURATION first, return a function that takes the DATA last. That
//  ordering is the whole reason `filter(propEq('active', true))` reads as
//  a phrase: each piece is fully configured before the list ever shows up.
//  Two details worth keeping:
//  · `sortBy` copies before sorting. `sort` mutates and returns the same
//    array, so a combinator that forgets `[...list]` quietly reorders the
//    caller's data — and against the frozen fixture here, throws.
//  · a predicate can itself be a pipe: `pipe(prop('price'), lessThan(10))`
//    is a getter feeding a comparison, and `filter` cannot tell the
//    difference.
//  Do not take this too far. Point-free pays when the combinators are
//  named things that repeat; `pipe(compose(not, isEmpty), prop('x'))` for
//  a one-off is a puzzle, and a plain arrow would have been kinder.

import { test, eq, ok } from '../../_lib/check.js';

const deepFreeze = (value) => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
  }
  return Object.freeze(value);
};

// ── given: the plumbing ──────────────────────────────────────────────────

const pipe = (...fns) => (input) => fns.reduce((value, fn) => fn(value), input);
const map = (fn) => (list) => list.map(fn);
const filter = (pred) => (list) => list.filter(pred);
const lessThan = (limit) => (value) => value < limit;
const lineTotal = (item) => item.price * item.qty;

const users = deepFreeze([
  { name: 'Bo', active: true, age: 34 },
  { name: 'Alexandra', active: false, age: 28 },
  { name: 'Grace', active: true, age: 45 },
]);

const items = deepFreeze([
  { sku: 'mug', price: 12, qty: 2, tag: 'kitchen' },
  { sku: 'pen', price: 3, qty: 10, tag: 'office' },
  { sku: 'ink', price: 8, qty: 1, tag: 'office' },
]);

export function prop(key) {
  return (obj) => obj[key];
}

export function propEq(key, value) {
  return (obj) => obj[key] === value;
}

export function sortBy(fn) {
  const compare = (a, b) => {
    const [x, y] = [fn(a), fn(b)];
    if (x < y) return -1;
    return x > y ? 1 : 0;
  };
  return (list) => [...list].sort(compare);
}

export function sumBy(fn) {
  return (list) => list.reduce((total, item) => total + fn(item), 0);
}

export function activeNames(users) {
  return pipe(filter(propEq('active', true)), map(prop('name')))(users);
}

export function cheapSkusByPrice(items) {
  return pipe(
    filter(pipe(prop('price'), lessThan(10))),
    sortBy(prop('price')),
    map(prop('sku'))
  )(items);
}

export function officeStockValue(items) {
  return pipe(filter(propEq('tag', 'office')), sumBy(lineTotal))(items);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('prop reads one key and is reusable everywhere', () => {
  const name = prop('name');
  eq(name(users[0]), 'Bo');
  eq(users.map(name), ['Bo', 'Alexandra', 'Grace']);
  eq(prop('missing')({}), undefined);
});

test('propEq compares strictly', () => {
  eq(propEq('active', true)(users[0]), true);
  eq(propEq('active', true)(users[1]), false);
  eq(propEq('age', '34')(users[0]), false, 'no coercion');
});

test('sortBy returns a new list and leaves the old order alone', () => {
  const byAge = sortBy(prop('age'));
  eq(byAge(users).map(prop('name')), ['Alexandra', 'Bo', 'Grace']);
  eq(users.map(prop('name')), ['Bo', 'Alexandra', 'Grace']);
  ok(byAge(users) !== users, 'a copy, not the frozen original');
});

test('sortBy handles strings as well as numbers', () => {
  eq(sortBy(prop('sku'))(items).map(prop('sku')), ['ink', 'mug', 'pen']);
});

test('sumBy totals a computed number per item', () => {
  eq(sumBy(lineTotal)(items), 24 + 30 + 8);
  eq(sumBy(prop('age'))(users), 107);
  eq(sumBy(lineTotal)([]), 0);
});

test('activeNames: filter, then pluck', () => {
  eq(activeNames(users), ['Bo', 'Grace']);
  eq(activeNames([]), []);
});

test('cheapSkusByPrice: filter, sort, pluck', () => {
  eq(cheapSkusByPrice(items), ['pen', 'ink']);
  eq(cheapSkusByPrice([{ sku: 'rug', price: 40, qty: 1 }]), []);
});

test('officeStockValue: filter, then total', () => {
  eq(officeStockValue(items), 38);
  eq(officeStockValue([]), 0);
  eq(items[0].price, 12, 'the fixture survived all three pipelines');
});
