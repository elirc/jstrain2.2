// ─────────────────────────────────────────────────────────────────────────
//  01 · function flavors                                   ★☆☆ warm-up
//  concepts: declarations · expressions · arrows
//  run: node 01-function-flavors.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Three ways to write "add two numbers". They compute the same result but
//  they are not the same kind of object: .name, .length, .prototype and
//  `new` all behave differently.
//
//      sumDeclaration(2, 3)   → 5
//      sumExpression(2, 3)    → 5
//      sumArrow(2, 3)         → 5
//
//  Fill in the three bodies, keeping each flavor as it is written. Then
//  read the test names — they are the actual lesson.

import { test, eq, ok } from '../../_lib/check.js';

export function sumDeclaration(a, b) {
  throw new Error('TODO');
}

export const sumExpression = function (a, b) {
  throw new Error('TODO');
};

export const sumArrow = (a, b) => {
  throw new Error('TODO');
};

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
