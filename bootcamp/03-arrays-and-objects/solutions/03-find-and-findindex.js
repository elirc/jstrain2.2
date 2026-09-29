// ─────────────────────────────────────────────────────────────────────────
//  03 · find · findIndex · findLast — SOLUTION             ★☆☆ warm-up
//  run: node 03-find-and-findindex.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `find` returns the first matching ELEMENT, `findIndex` the
//  first matching INDEX, `findLast` scans from the right. The miss values
//  differ on purpose — `undefined` for the element flavours, `-1` for the
//  index flavour — so `if (findIndex(...))` is a bug waiting to happen:
//  index 0 is falsy and -1 is truthy. Always compare against -1 explicitly.

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

export function findById(products, id) {
  return products.find((p) => p.id === id);
}

export function indexOfCategory(products, category) {
  return products.findIndex((p) => p.category === category);
}

export function lastUnder(products, maxPrice) {
  return products.findLast((p) => p.price <= maxPrice);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('findById returns the matching product object', () => {
  eq(findById(PRODUCTS, 'p3').name, 'Monitor');
});

test('findById returns undefined when the id is unknown', () => {
  eq(findById(PRODUCTS, 'nope'), undefined);
});

test('indexOfCategory returns the position of the first match', () => {
  eq(indexOfCategory(PRODUCTS, 'adapter'), 3);
});

test('indexOfCategory returns -1 when nothing matches', () => {
  eq(indexOfCategory(PRODUCTS, 'audio'), -1);
});

test('lastUnder scans from the right, so it skips earlier matches', () => {
  const hit = lastUnder(PRODUCTS, 40);
  ok(hit.id === 'p8', `expected Desk Lamp, got ${hit && hit.name}`);
});

test('lastUnder returns undefined when nothing is cheap enough', () => {
  eq(lastUnder(PRODUCTS, 5), undefined);
});
