// ─────────────────────────────────────────────────────────────────────────
//  01 · map basics                                         ★☆☆ warm-up
//  concepts: map · projecting fields
//  run: node 01-map-basics.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You are building the catalogue page for a small hardware shop. Three
//  projections, all with `map` — same length out as in, no filtering.
//
//      names(PRODUCTS)          → ['Keyboard', 'Mouse', ...]
//      priceTags(PRODUCTS)      → ['Keyboard - $89', 'Mouse - $45', ...]
//      numbered(['a', 'b'])     → ['1. a', '2. b']
//
//  `map` never changes the array you give it: it hands back a brand new one.

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

export function names(products) {
  throw new Error('TODO');
}

export function priceTags(products) {
  throw new Error('TODO');
}

export function numbered(labels) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('names lists every product name in catalogue order', () => {
  eq(names(PRODUCTS).slice(0, 4), ['Keyboard', 'Mouse', 'Monitor', 'USB-C Hub']);
});

test('names returns one entry per product', () => {
  eq(names(PRODUCTS).length, 8);
});

test('names leaves the catalogue untouched', () => {
  const result = names(PRODUCTS);
  ok(result !== PRODUCTS);
  eq(PRODUCTS[0].name, 'Keyboard');
});

test('priceTags glues the name and the price together', () => {
  const tags = priceTags(PRODUCTS);
  eq(tags[0], 'Keyboard - $89');
  eq(tags[6], 'HDMI Cable - $12');
});

test('priceTags of an empty catalogue is an empty array', () => {
  eq(priceTags([]), []);
});

test('numbered starts counting at 1', () => {
  eq(numbered(['alpha', 'beta', 'gamma']), ['1. alpha', '2. beta', '3. gamma']);
});
