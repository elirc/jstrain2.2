// ─────────────────────────────────────────────────────────────────────────
//  02 · filter basics — SOLUTION                           ★☆☆ warm-up
//  run: node 02-filter-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a predicate is just a function returning true/false, and
//  `filter` is a loop that keeps the trues. Two things worth internalising:
//  the survivors are the SAME object references as in the source array (no
//  copying happens, so mutating one mutates the original), and a filter that
//  matches nothing gives you `[]`, never `undefined` or `null`. Also note
//  `atMost` uses `<=` — off-by-one on the boundary is the classic bug here.

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

const ids = (list) => list.map((p) => p.id);

export function inStock(products) {
  return products.filter((p) => p.stock > 0);
}

export function atMost(products, maxPrice) {
  return products.filter((p) => p.price <= maxPrice);
}

export function inCategory(products, category) {
  return products.filter((p) => p.category === category);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('inStock drops everything with zero stock', () => {
  eq(ids(inStock(PRODUCTS)), ['p1', 'p3', 'p4', 'p5', 'p7', 'p8']);
});

test('inStock hands back the same objects, not copies', () => {
  ok(inStock(PRODUCTS)[0] === PRODUCTS[0]);
});

test('atMost keeps everything at or below the limit', () => {
  eq(ids(atMost(PRODUCTS, 50)), ['p2', 'p4', 'p7', 'p8']);
});

test('atMost includes a product priced exactly at the limit', () => {
  eq(ids(atMost(PRODUCTS, 29)), ['p4', 'p7']);
});

test('inCategory picks out one category', () => {
  eq(ids(inCategory(PRODUCTS, 'adapter')), ['p4', 'p7']);
});

test('a filter that matches nothing returns an empty array', () => {
  eq(inCategory(PRODUCTS, 'audio'), []);
});
