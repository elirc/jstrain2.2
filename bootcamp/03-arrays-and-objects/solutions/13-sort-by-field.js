// ─────────────────────────────────────────────────────────────────────────
//  13 · sorting objects by a field — SOLUTION              ★★☆ core
//  run: node 13-sort-by-field.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `(a, b) => a.price - b.price` sorts objects by a number;
//  flip the operands for descending. Strings cannot be subtracted, so use
//  `localeCompare`, which knows that 'apple' belongs before 'Banana' —
//  the default sort compares UTF-16 code units, where every capital letter
//  sorts before every lowercase one. Sort in JS is stable (spec-guaranteed
//  since ES2019), so the two products with 0 stock keep their catalogue
//  order in `byStockDesc`; that is what makes multi-key sorting work.

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
  return [...products].sort((a, b) => a.price - b.price);
}

export function byStockDesc(products) {
  return [...products].sort((a, b) => b.stock - a.stock);
}

export function sortNames(names) {
  return [...names].sort((a, b) => a.localeCompare(b, 'en'));
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
