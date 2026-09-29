// ─────────────────────────────────────────────────────────────────────────
//  14 · hoisting and the TDZ                                    ★★☆ core
//  concepts: var vs let · hoisting · temporal dead zone · block scope
//  run: node 14-var-let-scope.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Write three functions that PROVE how the declarations differ. You are
//  not implementing an algorithm — you are arranging code so the return
//  values come out as specified.
//
//  varProbe(): read `count` on the first line, THEN `var count = 5`.
//              Return [valueRead, count]        → [undefined, 5]
//
//  letProbe(): read `ready` on the first line inside a try/catch, THEN
//              `let ready = 5`. Return [errorConstructorName, ready]
//                                               → ['ReferenceError', 5]
//
//  blockScope(): declare `var fromVar = 'outer'` and `let fromLet =
//              'outer'`, then inside an `if (true) { }` block re-declare
//              both as 'inner'. Return { fromVar, fromLet } as seen from
//              outside the block          → { fromVar: 'inner',
//                                             fromLet: 'outer' }
//
//  hint: `var` is hoisted AND initialized to undefined; `let`/`const` are
//  hoisted but stay unreachable until their line runs — that gap is the
//  temporal dead zone. `var` is function-scoped, `let` is block-scoped.

import { test, eq } from '../../_lib/check.js';

export function varProbe() {
  throw new Error('TODO');
}

export function letProbe() {
  throw new Error('TODO');
}

export function blockScope() {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a var read before its line is undefined, not an error', () => {
  eq(varProbe()[0], undefined);
});

test('the var still gets its value once the line runs', () => {
  eq(varProbe(), [undefined, 5]);
});

test('a let read inside its TDZ throws a ReferenceError', () => {
  eq(letProbe()[0], 'ReferenceError');
});

test('the same let is perfectly usable after its line', () => {
  eq(letProbe(), ['ReferenceError', 5]);
});

test('var ignores the block — the inner assignment escapes', () => {
  eq(blockScope().fromVar, 'inner');
});

test('let creates a separate binding inside the block', () => {
  eq(blockScope().fromLet, 'outer');
  eq(blockScope(), { fromVar: 'inner', fromLet: 'outer' });
});
