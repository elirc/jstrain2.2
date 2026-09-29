// ─────────────────────────────────────────────────────────────────────────
//  01 · function flavors — SOLUTION                        ★☆☆ warm-up
//  run: node 01-function-flavors.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the bodies are identical on purpose — the interesting part
//  is what the runtime hands you around them. A declaration and a function
//  expression both create "full" function objects: they have a .prototype
//  and can be constructed with `new`. An arrow is a leaner thing: no
//  .prototype, not constructible, and (see 06) no `this` of its own.
//  .name is not magic either — an anonymous function expression assigned
//  to a `const` inherits the variable's name.

import { test, eq, ok } from '../../_lib/check.js';

export function sumDeclaration(a, b) {
  return a + b;
}

export const sumExpression = function (a, b) {
  return a + b;
};

export const sumArrow = (a, b) => a + b;

// ──────────────────────────── tests ──────────────────────────────────────

test('all three flavors compute the same result', () => {
  eq(sumDeclaration(2, 3), 5);
  eq(sumExpression(2, 3), 5);
  eq(sumArrow(2, 3), 5);
});

test('each function picks up a name from its binding', () => {
  eq(sumDeclaration(1, 1), 2);
  eq(sumDeclaration.name, 'sumDeclaration');
  eq(sumExpression.name, 'sumExpression');
  eq(sumArrow.name, 'sumArrow');
});

test('length reports the declared parameter count', () => {
  eq(sumArrow(1, 1), 2);
  eq(sumDeclaration.length, 2);
  eq(sumExpression.length, 2);
  eq(sumArrow.length, 2);
});

test('only non-arrow functions carry a prototype object', () => {
  eq(sumExpression(4, 4), 8);
  eq(typeof sumDeclaration.prototype, 'object');
  eq(typeof sumExpression.prototype, 'object');
  eq(sumArrow.prototype, undefined);
});

test('an arrow cannot be called with new', () => {
  eq(sumArrow(0, 0), 0);
  let err = null;
  try {
    new sumArrow(1, 2);
  } catch (e) {
    err = e;
  }
  ok(err instanceof TypeError, 'new on an arrow should throw a TypeError');
});

test('a function declaration can be called with new', () => {
  eq(sumDeclaration(0, 0), 0);
  ok(new sumDeclaration(1, 2) instanceof sumDeclaration);
});
