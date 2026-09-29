// ─────────────────────────────────────────────────────────────────────────
//  01 · makeRectangle — SOLUTION                           ★☆☆ warm-up
//  run: node 01-object-methods.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: method shorthand — `area() { ... }` — is just
//  `area: function () { ... }` with less noise. The important part is
//  `this`: it is not decided when the function is written, it is decided
//  at the call site by whatever sits left of the dot. That is why one
//  function body works for every rectangle.
//
//  `scaleBy` returns `this` so calls chain. Notice the last test: every
//  call to makeRectangle allocates FRESH function objects — a thousand
//  rectangles means a thousand copies of `area`. That waste is exactly
//  the problem prototypes solve (exercises 05–07).

import { test, eq, ok } from '../../_lib/check.js';

export function makeRectangle(width, height) {
  return {
    width,
    height,

    area() {
      return this.width * this.height;
    },

    scaleBy(factor) {
      this.width *= factor;
      this.height *= factor;
      return this;
    },

    describe() {
      return `${this.width}x${this.height} rectangle`;
    },
  };
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
