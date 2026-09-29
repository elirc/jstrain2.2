// ─────────────────────────────────────────────────────────────────────────
//  06 · promisify                                          ★★★ stretch
//  concepts: higher-order functions · promise adapters · rest args
//  run: node 06-promisify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The bridge between the two worlds. Take any error-first callback
//  function and return a version that returns a promise instead.
//
//      const addP = promisify(add);
//      await addP(2, 3)            → 5
//      await promisify(boom)()     → rejects with the callback's Error
//
//  The returned function takes the same arguments MINUS the callback,
//  and appends its own. Extra credit built into the tests: a wrapped
//  function that throws synchronously must reject, not throw, and a
//  buggy API that calls its callback twice must not break anything.
//
//  hint: (...args) => new Promise((resolve, reject) => fn(...args, cb))

import { test, eq, ok, rejects } from '../../_lib/check.js';

export function add(a, b, cb) {
  setTimeout(() => cb(null, a + b), 5);
}

export function boom(cb) {
  setTimeout(() => cb(new Error('kaboom')), 5);
}

export function needsString(value, cb) {
  if (typeof value !== 'string') {
    throw new TypeError('value must be a string');
  }
  setTimeout(() => cb(null, value.toUpperCase()), 5);
}

export function callsBackTwice(cb) {
  setTimeout(() => {
    cb(null, 'first');
    cb(null, 'second');
  }, 5);
}

export function promisify(fn) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a function, not a promise', () => {
  const wrapped = promisify(add);
  ok(typeof wrapped === 'function');
});

test('resolves with the value the callback receives', async () => {
  eq(await promisify(add)(2, 3), 5);
});

test('forwards every argument to the original function', async () => {
  eq(await promisify(add)(20, 22), 42);
});

test('rejects with the error the callback receives', async () => {
  await rejects(promisify(boom)(), 'kaboom');
});

test('turns a synchronous throw into a rejection', async () => {
  const p = promisify(needsString)(7);
  await rejects(p, 'must be a string');
});

test('survives a callback that fires twice', async () => {
  eq(await promisify(callsBackTwice)(), 'first');
});
