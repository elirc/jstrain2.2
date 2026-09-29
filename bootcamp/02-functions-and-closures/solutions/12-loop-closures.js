// ─────────────────────────────────────────────────────────────────────────
//  12 · closures in a loop — SOLUTION                      ★★☆ core
//  run: node 12-loop-closures.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a closure captures the VARIABLE, not the value at the
//  moment it was created. `var i` is one binding for the whole function,
//  so all three arrows point at the same `i` — and by the time anyone
//  calls them the loop has left `i` at 3. `let i` is re-created on each
//  iteration, so each arrow closes over a different binding. Before ES6
//  the fix was to call a function per iteration: the parameter `captured`
//  is a per-call binding, which is the same trick spelled by hand.

import { test, eq, ok } from '../../_lib/check.js';

export function brokenWithVar() {
  const fns = [];
  for (var i = 0; i < 3; i += 1) {
    fns.push(() => i);
  }
  return fns;
}

export function fixedWithLet() {
  const fns = [];
  for (let i = 0; i < 3; i += 1) {
    fns.push(() => i);
  }
  return fns;
}

export function fixedWithIIFE() {
  const fns = [];
  for (var i = 0; i < 3; i += 1) {
    (function (captured) {
      fns.push(() => captured);
    })(i);
  }
  return fns;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('var shares one binding, so every function reports 3', () => {
  const fns = brokenWithVar();
  eq(fns.length, 3);
  eq(fns.map((f) => f()), [3, 3, 3]);
});

test('the broken version really is written with var', () => {
  brokenWithVar();
  ok(/\bvar\b/.test(brokenWithVar.toString()), 'expected a var loop');
});

test('let gives every iteration its own binding', () => {
  eq(fixedWithLet().map((f) => f()), [0, 1, 2]);
});

test('an IIFE copies the value into a fresh scope', () => {
  eq(fixedWithIIFE().map((f) => f()), [0, 1, 2]);
});

test('the IIFE version still uses var for the counter', () => {
  fixedWithIIFE();
  ok(/\bvar\b/.test(fixedWithIIFE.toString()), 'keep the var loop');
});

test('the fixed functions can be called in any order', () => {
  const fns = fixedWithLet();
  eq(fns[2](), 2);
  eq(fns[0](), 0);
  eq(fns[1](), 1);
  eq(fns[0](), 0);
});

test('both fixes agree with each other', () => {
  eq(
    fixedWithLet().map((f) => f()),
    fixedWithIIFE().map((f) => f())
  );
});
