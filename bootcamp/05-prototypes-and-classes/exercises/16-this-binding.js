// ─────────────────────────────────────────────────────────────────────────
//  16 · losing this                                        ★★☆ core
//  concepts: this · bind · arrow fields · callbacks
//  run: node 16-this-binding.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `this` is decided by the CALL, not by the class. Pull a method off its
//  object — `onClick={counter.increment}`, `setTimeout(c.tick, 10)` — and
//  the `this` is gone. Build the problem and its three fixes.
//
//    detach(obj, name)   → obj[name], the bare function (the problem)
//    wrap(obj, name)     → a function that always calls obj[name] on obj
//                          (fix 3: the wrapper)
//
//    class Clicker
//      clicks             a field starting at 0
//      plainClick()       a normal method: this.clicks += 1, returns it
//      boundClick         the same behaviour, bound in the constructor
//                         (fix 1)
//      arrowClick         the same behaviour, as an arrow class field
//                         (fix 2)
//
//      const c = new Clicker();
//      c.plainClick()              → 1
//      detach(c, 'plainClick')()   → TypeError: this is undefined
//      detach(c, 'boundClick')()   → 2
//      detach(c, 'arrowClick')()   → 3
//      wrap(c, 'plainClick')()     → 4
//
//  hint: boundClick is not a method at all — it is a property the
//  constructor assigns from this.plainClick.bind(this)

import { test, eq, ok, throws } from '../../_lib/check.js';

export function detach(obj, name) {
  throw new Error('TODO');
}

export function wrap(obj, name) {
  throw new Error('TODO');
}

export class Clicker {
  constructor() {
    throw new Error('TODO');
  }

  plainClick() {
    throw new Error('TODO');
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
