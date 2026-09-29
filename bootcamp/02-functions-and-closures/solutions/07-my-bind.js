// ─────────────────────────────────────────────────────────────────────────
//  07 · build bind yourself — SOLUTION                     ★★★ stretch
//  run: node 07-my-bind.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: bind is a closure over three things — the function, the
//  receiver and the preset arguments. The returned arrow deliberately has
//  no `this` of its own, so however it is later called (bare, as a
//  method, or re-bound) it can only reach the captured `thisArg`. That is
//  why "a bound function cannot be rebound" falls out for free.
//  apply takes the arguments as one array, which makes concatenating
//  presets and later arguments a single spread.
//  The classic wrong turn: `return () => fn(...preset)` — it drops both
//  the receiver and the arguments passed at call time.

import { test, eq, ok, spy } from '../../_lib/check.js';

export function myBind(fn, thisArg, ...preset) {
  return (...later) => fn.apply(thisArg, [...preset, ...later]);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a new function, not the original', () => {
  const speak = () => 'hi';
  const bound = myBind(speak, null);
  ok(typeof bound === 'function');
  ok(bound !== speak, 'bind must not hand back the same function');
});

test('sets the receiver for the call', () => {
  const dog = { sound: 'woof', speak() { return this.sound; } };
  const speak = myBind(dog.speak, dog);
  eq(speak(), 'woof');
});

test('forwards the arguments it is called with', () => {
  const fn = spy((a, b) => a + b);
  const bound = myBind(fn, null);
  eq(bound(2, 3), 5);
  eq(fn.calls, [[2, 3]]);
});

test('puts preset arguments in front of the later ones', () => {
  const fn = spy((...args) => args);
  const bound = myBind(fn, null, 1, 2);
  eq(bound(3, 4), [1, 2, 3, 4]);
  eq(fn.calls, [[1, 2, 3, 4]]);
});

test('calls the original exactly once per call', () => {
  const fn = spy(() => 'x');
  const bound = myBind(fn, null);
  bound();
  bound();
  eq(fn.callCount, 2);
});

test('the receiver wins even when called as another object method', () => {
  const dog = { sound: 'woof', speak() { return this.sound; } };
  const cow = { sound: 'moo' };
  cow.speak = myBind(dog.speak, dog);
  eq(cow.speak(), 'woof');
});

test('a bound function cannot be rebound', () => {
  const dog = { sound: 'woof', speak() { return this.sound; } };
  const cow = { sound: 'moo' };
  const bound = myBind(dog.speak, dog);
  eq(bound.bind(cow)(), 'woof');
});

test('each bound function keeps its own presets', () => {
  const log = (level, msg) => `${level}: ${msg}`;
  const warn = myBind(log, null, 'WARN');
  const info = myBind(log, null, 'INFO');
  eq(warn('disk full'), 'WARN: disk full');
  eq(info('all good'), 'INFO: all good');
  eq(warn('again'), 'WARN: again');
});
