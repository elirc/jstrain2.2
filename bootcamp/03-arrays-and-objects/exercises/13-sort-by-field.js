// ─────────────────────────────────────────────────────────────────────────
//  13 · sorting objects by a field                         ★★☆ core
//  concepts: sort · comparators · localeCompare
//  run: node 13-sort-by-field.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Same comparators, now reaching into objects. The catalogue is frozen,
//  so an in-place `products.sort(...)` throws — copy first.
//
//      byPriceAsc(PRODUCTS)   → HDMI Cable, USB-C Hub, Desk Lamp, ...
//      byStockDesc(PRODUCTS)  → HDMI Cable (58), USB-C Hub (31), ...
//      sortNames(['apple', 'Banana', 'cherry'])
//        → ['apple', 'Banana', 'cherry']     with localeCompare
//        → ['Banana', 'apple', 'cherry']     with a plain .sort()
//
//  Use `localeCompare(other, 'en')` in `sortNames` — pinning the locale
//  keeps the result the same on every machine.
//
//  hint: for strings, `a.localeCompare(b, 'en')` already returns
//  -1 / 0 / 1, so it IS the comparator.

import { test, eq } from '../../_lib/check.js';

const PRODUCTS = Object.freeze([
  { id: 'p1', name: 'Keyboard',     category: 'input',   price: 89,  stock: 12 },
  { id: 'p2', name: 'Mouse',        category: 'input',   price: 45,  stock: 0 },
  { id: 'p3', name: 'Monitor',      category: 'display', price: 320, stock: 4 },
  { id: 'p4', name: 'USB-C Hub',    category: 'adapter', price: 29,  stock: 31 },
  { id: 'p5', name: 'Laptop Stand', category: 'desk',    price: 55,  stock: 7 },
  { id: 'p6', name: 'Webcam',       category: 'video',   price: 62,  stock: 0 },
  { id: 'p7', name: 'HDMI Cable',   category: 'adapter', price: 12,  stock: 58 },
  { id: 'p8', name: 'Desk Lamp',    category: 'desk',    price: 34,  stock: 3 },
]);

const ids = (list) => list.map((p) => p.id);

export function byPriceAsc(products) {
  throw new Error('TODO');
}

export function byStockDesc(products) {
  throw new Error('TODO');
}

export function sortNames(names) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('byPriceAsc puts the cheapest product first', () => {
  eq(ids(byPriceAsc(PRODUCTS)), ['p7', 'p4', 'p8', 'p2', 'p5', 'p6', 'p1', 'p3']);
});

test('byPriceAsc copies instead of sorting the frozen catalogue', () => {
  eq(ids(byPriceAsc(PRODUCTS))[0], 'p7');
  eq(ids(PRODUCTS)[0], 'p1');
});

test('byStockDesc puts the fullest shelf first', () => {
  eq(ids(byStockDesc(PRODUCTS)), ['p7', 'p4', 'p1', 'p5', 'p3', 'p8', 'p2', 'p6']);
});

test('ties keep their original order - sort is stable', () => {
  const zeros = byStockDesc(PRODUCTS).filter((p) => p.stock === 0);
  eq(ids(zeros), ['p2', 'p6']);
});

test('sortNames orders case-insensitively, unlike a bare sort', () => {
  eq(sortNames(['apple', 'Banana', 'cherry']), ['apple', 'Banana', 'cherry']);
  eq(['apple', 'Banana', 'cherry'].sort(), ['Banana', 'apple', 'cherry']);
});

test('sortNames sorts the catalogue names alphabetically', () => {
  eq(sortNames(PRODUCTS.map((p) => p.name)).slice(0, 3), [
    'Desk Lamp',
    'HDMI Cable',
    'Keyboard',
  ]);
});

test('sortNames of an empty list is an empty list', () => {
  eq(sortNames([]), []);
});
