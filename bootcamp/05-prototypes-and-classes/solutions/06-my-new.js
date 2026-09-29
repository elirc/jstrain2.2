// ─────────────────────────────────────────────────────────────────────────
//  06 · myNew — SOLUTION                                   ★★★ stretch
//  run: node 06-my-new.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the four steps of `new`, one line each.
//    1. make an empty object
//    2. link it to Ctor.prototype   ← Object.create does 1 and 2 at once
//    3. run the body with `this` = that object
//    4. return the body's result IF it is an object, else the new object
//
//  Step 2 is the whole point of this module: `new` does not copy methods
//  onto the instance, it just points the instance's [[Prototype]] at
//  Ctor.prototype. That single link is what `instanceof` walks and what
//  every method lookup follows.
//
//  Step 4 is what makes `class X { constructor() { return other; } }`
//  legal. Functions count as objects here too, hence the typeof check.
//  Real `new` also rejects arrow functions and methods, which have no
//  [[Construct]] slot — nothing you can reproduce in plain JS.

import { test, eq, ok } from '../../_lib/check.js';

// ── scaffolding: three constructors to test against ──────────────────────

function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.toString = function () {
  return `(${this.x}, ${this.y})`;
};

function Sneaky() {
  this.hidden = true;
  return { replaced: true };
}

function Adder(n) {
  this.n = n;
  return 42;
}

export function myNew(Ctor, ...args) {
  if (typeof Ctor !== 'function') {
    throw new TypeError('myNew needs a constructor function');
  }
  const instance = Object.create(Ctor.prototype);
  const result = Ctor.apply(instance, args);
  const returnedAnObject =
    (typeof result === 'object' && result !== null) ||
    typeof result === 'function';
  return returnedAnObject ? result : instance;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('runs the constructor body against a fresh object', () => {
  const p = myNew(Point, 1, 2);
  eq(p.x, 1);
  eq(p.y, 2);
});

test('links the new object to Ctor.prototype', () => {
  const p = myNew(Point, 0, 0);
  ok(Object.getPrototypeOf(p) === Point.prototype);
  ok(p instanceof Point);
});

test('so inherited methods work on it', () => {
  const p = myNew(Point, 3, 4);
  eq(p.toString(), '(3, 4)');
  eq(Object.hasOwn(p, 'toString'), false);
});

test('forwards every argument in order', () => {
  const p = myNew(Point, 'a', 'b');
  eq([p.x, p.y], ['a', 'b']);
});

test('two calls produce two independent objects', () => {
  const a = myNew(Point, 1, 1);
  const b = myNew(Point, 2, 2);
  a.x = 99;
  eq(b.x, 2);
});

test('an object returned by the constructor wins', () => {
  const s = myNew(Sneaky);
  eq(s, { replaced: true });
  eq(s.hidden, undefined);
  eq(s instanceof Sneaky, false);
});

test('a primitive returned by the constructor is ignored', () => {
  const a = myNew(Adder, 5);
  eq(a.n, 5);
  ok(a instanceof Adder);
});
