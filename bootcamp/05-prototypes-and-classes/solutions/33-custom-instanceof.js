// ─────────────────────────────────────────────────────────────────────────
//  33 · custom instanceof — SOLUTION                       ★★★ stretch
//  run: node 33-custom-instanceof.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `x instanceof T` is not a language primitive, it is a
//  protocol. The engine looks for T[Symbol.hasInstance] first and calls
//  it; only if there is none does it fall back to walking x's prototype
//  chain (which is itself just the inherited default living on
//  Function.prototype — that is why a plain `{}` on the right throws "not
//  callable" while `Iterable` does not).
//
//  So hasInstance lets you answer "does this behave like one of these?"
//  instead of "was this built by this constructor?". interfaceOf() turns
//  that into a runtime interface: name the methods, get a checker. Note
//  it uses `typeof value[name] === 'function'`, which reads through the
//  prototype chain — that is why a class instance passes without owning
//  a single one of the methods.
//
//  The trap is placement. `[Symbol.hasInstance](v) {}` inside a class body
//  is an instance method, so it lands on Odd.prototype where instanceof
//  never looks; `static` is what puts it on the class object itself.
//  And a warning worth keeping: overriding instanceof for a real class
//  makes a very confusing lie if the answer disagrees with the chain.

import { test, eq, ok, throws } from '../../_lib/check.js';

export class Even {
  static [Symbol.hasInstance](value) {
    return Number.isInteger(value) && value % 2 === 0;
  }
}

export const Iterable = {
  [Symbol.hasInstance](value) {
    return value != null && typeof value[Symbol.iterator] === 'function';
  },
};

export function interfaceOf(...methodNames) {
  return {
    [Symbol.hasInstance](value) {
      return (
        value != null &&
        methodNames.every((name) => typeof value[name] === 'function')
      );
    },
  };
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
