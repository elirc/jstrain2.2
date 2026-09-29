// ─────────────────────────────────────────────────────────────────────────
//  07 · build bind yourself                                ★★★ stretch
//  concepts: this · closures · apply
//  run: node 07-my-bind.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Re-implement Function.prototype.bind as a standalone function. Given a
//  function, a receiver and any number of preset arguments, return a NEW
//  function that always calls the original with that receiver, with the
//  presets in front of whatever arguments it is called with later.
//
//      const dog = { sound: 'woof', speak() { return this.sound; } };
//      myBind(dog.speak, dog)()          → 'woof'
//
//      const log = (level, msg) => `${level}: ${msg}`;
//      const warn = myBind(log, null, 'WARN');
//      warn('disk full')                 → 'WARN: disk full'
//
//  A bound function is welded to its receiver: binding it again does
//  nothing, and calling it as someone else's method does nothing either.
//
//  hint: fn.apply(thisArg, argsArray) — and remember arrows have no `this`
//  of their own, which is exactly why they work here

import { test, eq, ok, spy } from '../../_lib/check.js';

export function myBind(fn, thisArg, ...preset) {
  throw new Error('TODO');
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
