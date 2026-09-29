// ─────────────────────────────────────────────────────────────────────────
//  33 · custom instanceof                                  ★★★ stretch
//  concepts: Symbol.hasInstance · duck typing · protocols
//  run: node 33-custom-instanceof.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `x instanceof C` normally walks x's prototype chain looking for
//  C.prototype. But first it asks C for a Symbol.hasInstance method, and
//  if there is one, that method decides. The right-hand side does not even
//  have to be a class.
//
//      class Even { static [Symbol.hasInstance](v) {…} }
//      2 instanceof Even        → true
//      '2' instanceof Even      → false
//
//      const Iterable = { [Symbol.hasInstance](v) {…} };
//      [] instanceof Iterable   → true    ('a plain object' → false)
//
//      const Quacker = interfaceOf('quack', 'walk');
//      duck instanceof Quacker  → true if both methods exist, anywhere
//                                 on the object or its prototype chain
//
//  interfaceOf(...names) returns a checker object, so you can name a
//  protocol the way TypeScript names an interface — at runtime, and
//  without a shared base class.
//
//  hint: hasInstance has to be STATIC (on the class object itself) —
//  put it on the prototype and `instanceof` will never look there

import { test, eq, ok, throws } from '../../_lib/check.js';

export class Even {
  static [Symbol.hasInstance](value) {
    throw new Error('TODO');
  }
}

export const Iterable = {
  [Symbol.hasInstance](value) {
    throw new Error('TODO');
  },
};

export function interfaceOf(...methodNames) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('Even redefines instanceof for numbers', () => {
  eq(2 instanceof Even, true);
  eq(0 instanceof Even, true);
  eq(-4 instanceof Even, true);
  eq(3 instanceof Even, false);
  eq(2.5 instanceof Even, false);
});

test('and refuses anything that only looks like a number', () => {
  eq('2' instanceof Even, false);
  eq(NaN instanceof Even, false);
  eq(null instanceof Even, false);
  eq([2] instanceof Even, false);
});

test('the right-hand side does not have to be a class', () => {
  eq([] instanceof Iterable, true);
  eq('hi' instanceof Iterable, true);
  eq(new Set([1]) instanceof Iterable, true);
  eq(new Map() instanceof Iterable, true);
});

test('Iterable says no to the things for...of would reject', () => {
  eq(({}) instanceof Iterable, false);
  eq(3 instanceof Iterable, false);
  eq(null instanceof Iterable, false);
  eq(undefined instanceof Iterable, false);
});

test('interfaceOf names a protocol without a base class', () => {
  const Quacker = interfaceOf('quack', 'walk');
  const duck = { quack: () => 'quack', walk: () => 'waddle' };
  const robot = { walk: () => 'clank' };
  eq(duck instanceof Quacker, true);
  eq(robot instanceof Quacker, false);
  eq(null instanceof Quacker, false);
});

test('the check sees inherited methods, not just own ones', () => {
  const Quacker = interfaceOf('quack', 'walk');
  class Mallard {
    quack() {
      return 'quack';
    }
    walk() {
      return 'waddle';
    }
  }
  const m = new Mallard();
  eq(m instanceof Quacker, true, 'the methods live on the prototype');
  eq(Object.hasOwn(m, 'quack'), false);
  eq(m instanceof Mallard, true, 'ordinary instanceof still works too');
});

test('without hasInstance, a non-callable right-hand side throws', () => {
  eq(2 instanceof Even, true);
  throws(() => 3 instanceof {}, 'not callable');
});

test('hasInstance is ignored unless it is static', () => {
  class Odd {
    [Symbol.hasInstance](value) {
      return value % 2 === 1;
    }
  }
  eq(3 instanceof Odd, false, 'instanceof asks the CLASS, not the prototype');
  eq(new Odd() instanceof Odd, true, 'so the default behaviour is untouched');
  eq(3 instanceof Even, false, 'while Even, being static, really answers');
});
