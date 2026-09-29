// ─────────────────────────────────────────────────────────────────────────
//  12 · closures in a loop                                 ★★☆ core
//  concepts: closures · var vs let · IIFE
//  run: node 12-loop-closures.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The most famous closure bug in JavaScript. Build the same array of
//  three functions three ways — each function should report the index it
//  was created at.
//
//      brokenWithVar()   → [f, f, f]  where f() gives 3, 3, 3   ← the bug
//      fixedWithLet()    → [f, f, f]  where f() gives 0, 1, 2
//      fixedWithIIFE()   → [f, f, f]  where f() gives 0, 1, 2
//
//  Rules: brokenWithVar and fixedWithIIFE must both declare the loop
//  counter with `var`. fixedWithIIFE fixes it by calling a function per
//  iteration so the value gets copied into a new scope. fixedWithLet
//  changes nothing but the keyword.
//
//  hint: `var` has one binding for the whole function; `let` gets a fresh
//  binding on every iteration

import { test, eq, ok } from '../../_lib/check.js';

export function brokenWithVar() {
  throw new Error('TODO');
}

export function fixedWithLet() {
  throw new Error('TODO');
}

export function fixedWithIIFE() {
  throw new Error('TODO');
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
