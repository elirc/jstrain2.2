// ─────────────────────────────────────────────────────────────────────────
//  28 · point-free reps                                      ★★☆ core
//  concepts: combinators · currying · composition
//  run: node 28-point-free.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three pipelines, written the way everybody writes them first:
//
//    users.filter((u) => u.active).map((u) => u.name)
//    items.filter((i) => i.price < 10)
//         .sort((a, b) => a.price - b.price).map((i) => i.sku)
//    items.filter((i) => i.tag === 'office')
//         .reduce((s, i) => s + i.price * i.qty, 0)
//
//  Every one of those arrows is an unnamed idea. Name the four that repeat,
//  and the pipelines stop describing HOW and start describing WHAT.
//
//  Build the combinators:
//      prop(key)             → (obj) => the value at key
//      propEq(key, value)    → (obj) => strict === on that key
//      sortBy(fn)            → (list) => a NEW sorted list, ascending by fn
//      sumBy(fn)             → (list) => the total of fn over the list
//
//  Then rebuild the three pipelines out of them. Each body is exactly one
//  line — `return pipe(...)(input);` — and contains no `=>` at all.
//  pipe, map, filter, lessThan and lineTotal are given.
//
//  hint: `filter` takes a predicate, and a predicate built by piping a
//  getter into a comparison is still a predicate.

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
  throw new Error('TODO');
}

export function propEq(key, value) {
  throw new Error('TODO');
}

export function sortBy(fn) {
  throw new Error('TODO');
}

export function sumBy(fn) {
  throw new Error('TODO');
}

export function activeNames(users) {
  throw new Error('TODO');
}

export function cheapSkusByPrice(items) {
  throw new Error('TODO');
}

export function officeStockValue(items) {
  throw new Error('TODO');
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
