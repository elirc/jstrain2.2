// ─────────────────────────────────────────────────────────────────────────
//  27 · toggle and cycle                                   ★☆☆ warm-up
//  concepts: closures · state machines · factories
//  run: node 27-toggle-and-cycle.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two of the smallest state machines there are, both built the same way:
//  a variable in a closure plus a function that advances it.
//
//      const dark = makeToggle();       // starts off
//      dark()      → true               // flips, then reports the new state
//      dark()      → false
//
//      const dir = cycle('N', 'E', 'S', 'W');
//      dir()       → 'N'                // first call returns the FIRST value
//      dir()       → 'E'
//      dir(); dir(); dir()  → 'W', then 'N' again — it wraps
//
//      makeToggle(true)()  → false      // you can say where it starts
//      cycle()()           → undefined  // nothing to cycle through

import { test, eq, ok } from '../../_lib/check.js';

export function makeToggle(state = false) {
  throw new Error('TODO');
}

export function cycle(...values) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('a toggle starts off and reports the state after flipping', () => {
  const dark = makeToggle();
  eq(dark(), true);
  eq(dark(), false);
  eq(dark(), true);
});

test('a toggle can be started on', () => {
  const dark = makeToggle(true);
  eq(dark(), false);
  eq(dark(), true);
});

test('two toggles hold separate state', () => {
  const a = makeToggle();
  const b = makeToggle();
  a();
  a();
  eq(a(), true);
  eq(b(), true, 'b has only just been flipped for the first time');
});

test('cycle hands back the values in order, starting at the first', () => {
  const dir = cycle('N', 'E', 'S');
  eq([dir(), dir(), dir()], ['N', 'E', 'S']);
});

test('cycle wraps around forever', () => {
  const dir = cycle('N', 'E');
  eq([dir(), dir(), dir(), dir(), dir()], ['N', 'E', 'N', 'E', 'N']);
});

test('a one-value cycle keeps returning that value', () => {
  const only = cycle('N');
  eq([only(), only(), only()], ['N', 'N', 'N']);
});

test('an empty cycle returns undefined instead of blowing up', () => {
  const nothing = cycle();
  eq(nothing(), undefined);
  eq(nothing(), undefined);
});

test('two cycles over the same values keep separate positions', () => {
  const values = ['a', 'b', 'c'];
  const one = cycle(...values);
  const two = cycle(...values);
  one();
  one();
  eq(one(), 'c');
  eq(two(), 'a');
  ok(values.length === 3, 'the source array must not be consumed');
});
