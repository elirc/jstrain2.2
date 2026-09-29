// ─────────────────────────────────────────────────────────────────────────
//  15 · closures in loops — SOLUTION                         ★★★ stretch
//  run: node 15-loop-closures.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a closure captures a BINDING, not a value. With
//  `for (var i ...)` there is exactly one `i` for the whole loop, so all
//  three arrows share it and report 3 after the loop ends. `let` in the
//  for-header is special-cased by the spec: each iteration gets a fresh
//  binding, copied from the previous one — so each arrow closes over its
//  own `i`. (The old workaround was an IIFE per iteration, which did the
//  same thing manually.)
//
//  makeCounters is the same idea deliberately: `count` is declared inside
//  the factory, so every counter gets a private variable. Declaring it
//  once outside the map would give you n handles on ONE shared number —
//  which is exactly the loop bug, wearing a different hat.

import { test, eq, ok } from '../../_lib/check.js';

export function captureIndexes(list) {
  const fns = [];
  for (let i = 0; i < list.length; i += 1) {
    fns.push(() => i);
  }
  return fns;
}

export function makeCounters(count) {
  return Array.from({ length: count }, () => {
    let total = 0;
    return () => {
      total += 1;
      return total;
    };
  });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('captureIndexes returns one function per item', () => {
  const fns = captureIndexes(['a', 'b', 'c']);
  eq(fns.length, 3);
  ok(typeof fns[0] === 'function');
});

test('each captured function reports its own index', () => {
  eq(
    captureIndexes(['a', 'b', 'c']).map((f) => f()),
    [0, 1, 2]
  );
});

test('the last index is not smeared over all of them', () => {
  const fns = captureIndexes([10, 20, 30, 40]);
  eq(fns[0](), 0);
  eq(fns[3](), 3);
});

test('an empty list produces no functions', () => {
  eq(captureIndexes([]), []);
  eq(makeCounters(0), []);
});

test('a counter starts at 1 and keeps climbing', () => {
  const [tick] = makeCounters(1);
  eq(tick(), 1);
  eq(tick(), 2);
  eq(tick(), 3);
});

test('counters do not share state', () => {
  const [first, second] = makeCounters(2);
  first();
  first();
  eq(second(), 1);
  eq(first(), 3);
});

test('each call to makeCounters starts a fresh set', () => {
  const [a] = makeCounters(1);
  a();
  a();
  const [b] = makeCounters(1);
  eq(b(), 1);
  eq(a(), 3);
});
