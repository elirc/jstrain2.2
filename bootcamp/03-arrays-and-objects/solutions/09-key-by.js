// ─────────────────────────────────────────────────────────────────────────
//  09 · keyBy — building a lookup — SOLUTION               ★★☆ core
//  run: node 09-key-by.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `keyBy` is `groupBy` minus the array — one item per key.
//  That makes duplicate keys destructive, and silently so: index a list by
//  a field that is not unique and items vanish. Writing both policies makes
//  the choice explicit. Use `in` (or `Object.hasOwn`) rather than
//  `if (!acc[key])` for the first-wins check, otherwise a legitimately
//  falsy stored value (0, '', null) reads as "not seen yet".

import { test, eq, ok } from '../../_lib/check.js';

const PRODUCTS = [
  { id: 'p1', name: 'Keyboard',     category: 'input',   price: 89,  stock: 12 },
  { id: 'p2', name: 'Mouse',        category: 'input',   price: 45,  stock: 0 },
  { id: 'p3', name: 'Monitor',      category: 'display', price: 320, stock: 4 },
  { id: 'p4', name: 'USB-C Hub',    category: 'adapter', price: 29,  stock: 31 },
  { id: 'p5', name: 'Laptop Stand', category: 'desk',    price: 55,  stock: 7 },
  { id: 'p6', name: 'Webcam',       category: 'video',   price: 62,  stock: 0 },
  { id: 'p7', name: 'HDMI Cable',   category: 'adapter', price: 12,  stock: 58 },
  { id: 'p8', name: 'Desk Lamp',    category: 'desk',    price: 34,  stock: 3 },
];

export function keyBy(items, keyFn) {
  return items.reduce((index, item) => {
    index[keyFn(item)] = item;
    return index;
  }, {});
}

export function keyByFirst(items, keyFn) {
  return items.reduce((index, item) => {
    const key = keyFn(item);
    if (!(key in index)) index[key] = item;
    return index;
  }, {});
}

// ──────────────────────────── tests ──────────────────────────────────────

test('keyBy builds an id → product lookup', () => {
  eq(keyBy(PRODUCTS, (p) => p.id).p3.name, 'Monitor');
});

test('keyBy has one entry per unique key', () => {
  eq(Object.keys(keyBy(PRODUCTS, (p) => p.id)).length, 8);
});

test('keyBy stores the original objects', () => {
  ok(keyBy(PRODUCTS, (p) => p.id).p1 === PRODUCTS[0]);
});

test('on a duplicate key, keyBy lets the last item win', () => {
  eq(keyBy(PRODUCTS, (p) => p.category).desk.id, 'p8');
});

test('keyByFirst keeps the first item it saw', () => {
  eq(keyByFirst(PRODUCTS, (p) => p.category).desk.id, 'p5');
});

test('keyByFirst is not fooled by a falsy stored value', () => {
  const rows = [{ k: 'a', v: 0 }, { k: 'a', v: 9 }];
  eq(keyByFirst(rows, (r) => r.k).a.v, 0);
});

test('indexing an empty list gives an empty object', () => {
  eq(keyBy([], (x) => x), {});
});
