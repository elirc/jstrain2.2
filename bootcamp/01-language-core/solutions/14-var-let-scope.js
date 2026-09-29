// ─────────────────────────────────────────────────────────────────────────
//  14 · hoisting and the TDZ — SOLUTION                         ★★☆ core
//  run: node 14-var-let-scope.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: all three declarations are hoisted to the top of their
//  scope — the difference is what happens in the gap before the line
//  runs.
//
//  var: the binding exists and holds undefined, so reading it early is
//  legal and silently wrong. That silence is the bug.
//
//  let/const: the binding exists but is marked uninitialized. Touching it
//  throws ReferenceError — the temporal dead zone. It is a feature: the
//  error points at the real mistake instead of handing you undefined.
//
//  Scope: `var fromVar` inside the if block is the SAME binding as the
//  outer one (var is function-scoped, and the re-declaration is a no-op),
//  so the inner write leaks out. `let fromLet` inside the block is a new,
//  separate binding that shadows the outer one and dies at the `}`.

import { test, eq } from '../../_lib/check.js';

export function varProbe() {
  const valueRead = count; // hoisted, initialized to undefined
  var count = 5;
  return [valueRead, count];
}

export function letProbe() {
  let valueRead;
  try {
    valueRead = ready; // still in the temporal dead zone
  } catch (error) {
    valueRead = error.constructor.name;
  }
  let ready = 5;
  return [valueRead, ready];
}

export function blockScope() {
  var fromVar = 'outer';
  let fromLet = 'outer';
  if (true) {
    var fromVar = 'inner'; // same binding as above
    let fromLet = 'inner'; // brand new binding, block-local
    void fromLet;
  }
  return { fromVar, fromLet };
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
