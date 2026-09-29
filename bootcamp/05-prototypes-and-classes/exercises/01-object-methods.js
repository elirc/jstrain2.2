// ─────────────────────────────────────────────────────────────────────────
//  01 · makeRectangle                                      ★☆☆ warm-up
//  concepts: object literals · method shorthand · this
//  run: node 01-object-methods.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Before prototypes, before classes: an object that owns its own methods.
//  Build makeRectangle(width, height) — it returns a plain object literal
//  with two data properties and three methods written in shorthand form.
//
//      const r = makeRectangle(3, 4);
//      r.area()                  → 12
//      r.describe()              → '3x4 rectangle'
//      r.scaleBy(2).area()       → 48    (scaleBy returns the object)
//
//  Inside a method, `this` is whatever object the call went through —
//  `r.area()` means `this === r`.

import { test, eq, ok } from '../../_lib/check.js';

export function makeRectangle(width, height) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('keeps width and height as plain properties', () => {
  const r = makeRectangle(3, 4);
  eq(r.width, 3);
  eq(r.height, 4);
});

test('area multiplies the two sides', () => {
  eq(makeRectangle(3, 4).area(), 12);
  eq(makeRectangle(5, 5).area(), 25);
});

test('scaleBy grows both sides', () => {
  const r = makeRectangle(3, 4);
  r.scaleBy(2);
  eq(r.width, 6);
  eq(r.height, 8);
});

test('scaleBy returns the object so calls chain', () => {
  const r = makeRectangle(2, 2);
  eq(r.scaleBy(2).scaleBy(3).area(), 144);
});

test('describe reads the size at the moment it is called', () => {
  const r = makeRectangle(3, 4);
  eq(r.describe(), '3x4 rectangle');
  eq(r.scaleBy(10).describe(), '30x40 rectangle');
});

test('each rectangle carries its own state', () => {
  const a = makeRectangle(1, 1);
  const b = makeRectangle(2, 2);
  a.scaleBy(5);
  eq(a.area(), 25);
  eq(b.area(), 4);
});

test('each rectangle also carries its own copy of every method', () => {
  const a = makeRectangle(1, 1);
  const b = makeRectangle(1, 1);
  ok(a.area !== b.area, 'literals duplicate their methods per object');
});
