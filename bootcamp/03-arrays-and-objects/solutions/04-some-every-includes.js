// ─────────────────────────────────────────────────────────────────────────
//  04 · some · every · includes — SOLUTION                 ★☆☆ warm-up
//  run: node 04-some-every-includes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `some` is OR across the list, `every` is AND, and both stop
//  early at the first decisive element. The one that trips people up is
//  `[].every(...)` → true: "every element satisfies it" is vacuously true
//  when there are no elements, which is why an empty cart passes any
//  validation you write with `every`. `includes` compares with SameValueZero,
//  so unlike `indexOf` it can find NaN.

import { test, eq } from '../../_lib/check.js';

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

export function hasOutOfStock(products) {
  return products.some((p) => p.stock === 0);
}

export function allUnder(products, limit) {
  return products.every((p) => p.price < limit);
}

export function carries(products, category) {
  return products.map((p) => p.category).includes(category);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('hasOutOfStock spots a single empty shelf', () => {
  eq(hasOutOfStock(PRODUCTS), true);
});

test('hasOutOfStock is false when everything is stocked', () => {
  eq(hasOutOfStock(PRODUCTS.filter((p) => p.stock > 0)), false);
});

test('allUnder is true when the whole catalogue is below the limit', () => {
  eq(allUnder(PRODUCTS, 500), true);
});

test('allUnder is false as soon as one product is too expensive', () => {
  eq(allUnder(PRODUCTS, 100), false);
});

test('every on an empty list is true - vacuous truth', () => {
  eq(allUnder([], 1), true);
});

test('carries answers yes and no from the category list', () => {
  eq(carries(PRODUCTS, 'desk'), true);
  eq(carries(PRODUCTS, 'audio'), false);
});
