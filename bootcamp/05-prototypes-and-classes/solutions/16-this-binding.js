// ─────────────────────────────────────────────────────────────────────────
//  16 · losing this — SOLUTION                             ★★☆ core
//  run: node 16-this-binding.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `c.plainClick()` is two operations — read the property
//  (which walks the prototype chain) and call it with `this = c`. Store
//  the function in a variable and you keep only the first half; the call
//  now has no receiver, and class bodies are strict mode, so `this` is
//  undefined rather than globalThis. Hence the TypeError.
//
//  The three fixes, and their price:
//    1. bind in the constructor — one bound copy per instance, but the
//       prototype method stays available for super calls and spies.
//    2. arrow class field — `this` is captured lexically when the field
//       initialises. Also per instance, and it is NOT on the prototype,
//       so a subclass cannot super.arrowClick() it and it cannot be
//       overridden by a subclass method.
//    3. wrapper at the call site — nothing stored on the object at all;
//       the arrow closes over `obj` and looks the method up each time.
//
//  Rule of thumb: prefer a wrapper (`() => c.plainClick()`) at the point
//  where you hand the function away, and keep methods on the prototype.

import { test, eq, ok, throws } from '../../_lib/check.js';

export function detach(obj, name) {
  return obj[name];
}

export function wrap(obj, name) {
  return (...args) => obj[name](...args);
}

export class Clicker {
  clicks = 0;

  arrowClick = () => {
    this.clicks += 1;
    return this.clicks;
  };

  constructor() {
    this.boundClick = this.plainClick.bind(this);
  }

  plainClick() {
    this.clicks += 1;
    return this.clicks;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('called through the object, every version works', () => {
  const c = new Clicker();
  eq(c.plainClick(), 1);
  eq(c.boundClick(), 2);
  eq(c.arrowClick(), 3);
  eq(c.clicks, 3);
});

test('detached, the plain method loses its this', () => {
  const c = new Clicker();
  const loose = detach(c, 'plainClick');
  throws(loose, 'undefined', 'strict mode leaves this as undefined');
  eq(c.clicks, 0);
});

test('fix 1: the copy bound in the constructor survives', () => {
  const c = new Clicker();
  const loose = detach(c, 'boundClick');
  eq(loose(), 1);
  eq(loose(), 2);
  eq(c.clicks, 2);
});

test('fix 2: the arrow field survives', () => {
  const c = new Clicker();
  const loose = detach(c, 'arrowClick');
  eq(loose(), 1);
  eq(c.clicks, 1);
});

test('fix 3: the wrapper re-attaches the plain method', () => {
  const c = new Clicker();
  const safe = wrap(c, 'plainClick');
  eq(safe(), 1);
  eq(safe(), 2);
});

test('the fixes work as real callbacks', () => {
  const c = new Clicker();
  [1, 2, 3].forEach(detach(c, 'arrowClick'));
  eq(c.clicks, 3);
});

test('what each fix costs: the plain method is the only shared one', () => {
  const a = new Clicker();
  const b = new Clicker();
  ok(a.plainClick === b.plainClick, 'one copy on the prototype');
  ok(a.arrowClick !== b.arrowClick, 'a new closure per instance');
  ok(a.boundClick !== b.boundClick, 'a new bound function per instance');
});

test('the two fixes are own properties, the method is not', () => {
  const c = new Clicker();
  eq(Object.keys(c).sort(), ['arrowClick', 'boundClick', 'clicks']);
  eq(Object.hasOwn(c, 'plainClick'), false);
});
