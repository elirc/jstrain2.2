// ─────────────────────────────────────────────────────────────────────────
//  06 · promisify — SOLUTION                               ★★★ stretch
//  run: node 06-promisify.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: collect the caller's arguments with a rest parameter,
//  then call the original with those arguments plus a callback of your
//  own making that maps err → reject and value → resolve.
//  Two freebies come from the Promise machinery itself. A synchronous
//  throw inside the executor is caught by the Promise constructor and
//  becomes a rejection — that is why the sync-throw test passes without
//  a try/catch. And a promise settles exactly once, so a legacy API that
//  calls its callback twice is silently tolerated.
//  Wrong turn: `return new Promise(...)` inside promisify itself — that
//  calls fn immediately at wrap time. promisify returns a FUNCTION; the
//  promise is created per call.

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
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });
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
