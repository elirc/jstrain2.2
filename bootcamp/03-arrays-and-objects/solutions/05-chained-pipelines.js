// ─────────────────────────────────────────────────────────────────────────
//  05 · chained pipelines — SOLUTION                       ★★☆ core
//  run: node 05-chained-pipelines.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a chain reads as a pipeline: narrow, then shape, then
//  collapse. Filtering before mapping is not just style — it does less work
//  and keeps the objects (with all their fields) available to later
//  predicates. `join` collapses an array to a string and gives '' for an
//  empty array, which is why the unknown-category case needs no special
//  handling. `anyExpensiveOutOfStock` ends in `some`, so the chain collapses
//  to a boolean.

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

export function cheapInStockNames(products, maxPrice) {
  return products
    .filter((p) => p.stock > 0)
    .filter((p) => p.price <= maxPrice)
    .map((p) => p.name);
}

export function catalogueLine(products, category) {
  return products
    .filter((p) => p.category === category)
    .map((p) => p.name)
    .join(', ');
}

export function anyExpensiveOutOfStock(products, threshold) {
  return products
    .filter((p) => p.stock === 0)
    .some((p) => p.price > threshold);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('cheapInStockNames keeps catalogue order', () => {
  eq(cheapInStockNames(PRODUCTS, 60), [
    'USB-C Hub',
    'Laptop Stand',
    'HDMI Cable',
    'Desk Lamp',
  ]);
});

test('cheapInStockNames skips cheap products that are out of stock', () => {
  eq(cheapInStockNames(PRODUCTS, 45).includes('Mouse'), false);
});

test('cheapInStockNames of an empty catalogue is an empty array', () => {
  eq(cheapInStockNames([], 60), []);
});

test('catalogueLine joins the names of one category', () => {
  eq(catalogueLine(PRODUCTS, 'desk'), 'Laptop Stand, Desk Lamp');
});

test('catalogueLine of an unknown category is the empty string', () => {
  eq(catalogueLine(PRODUCTS, 'audio'), '');
});

test('anyExpensiveOutOfStock finds a pricey empty shelf', () => {
  eq(anyExpensiveOutOfStock(PRODUCTS, 50), true);
});

test('anyExpensiveOutOfStock is false when the gap is cheap', () => {
  eq(anyExpensiveOutOfStock(PRODUCTS, 100), false);
});
