// ─────────────────────────────────────────────────────────────────────────
//  06 · myNew                                              ★★★ stretch
//  concepts: new · Object.create · apply · return values
//  run: node 06-my-new.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `new` is not magic — it is four steps you can write yourself. Build
//  myNew(Ctor, ...args) so that it behaves exactly like `new Ctor(...)`:
//
//      myNew(Point, 1, 2)              → same as new Point(1, 2)
//      myNew(Point, 1, 2) instanceof Point   → true
//
//  The fourth step is the subtle one: a constructor that RETURNS an
//  object hands that object back instead of the freshly built one, but a
//  returned primitive (number, string, undefined...) is ignored.
//
//      myNew(Sneaky)   → { replaced: true }   (its own return wins)
//      myNew(Adder, 5) → { n: 5 }             (the 42 is thrown away)
//
//  hint: Object.create(proto) makes an object linked to `proto`, and
//  fn.apply(thisArg, argsArray) calls fn with a chosen `this`

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
  throw new Error('TODO');
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
