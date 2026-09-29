// ─────────────────────────────────────────────────────────────────────────
//  46 · promisifyMulti (several values) — SOLUTION          ★★☆ core
//  run: node 46-promisify-multi.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `(err, ...values)` collects everything after the error, and
//  zipping `keys` against `values` by index turns positional junk into a
//  named object. `Object.fromEntries(keys.map(...))` does the zip in one
//  line, and it naturally gives you both edge cases for free: a key with
//  no value becomes `undefined`, and a value with no key is never looked
//  at.
//  Why names rather than an array? Because `const { stdout, stderr } =
//  await run(cmd)` survives someone adding a fourth callback argument,
//  while `const [out, err] = ...` quietly shifts. Node's own
//  `util.promisify` solves this with a `promisify.custom` symbol for
//  exactly the same reason.
//  The synchronous-throw test passes without a try/catch: a throw inside
//  the Promise executor is caught by the constructor and becomes a
//  rejection. One error path, not two.
//  Wrong turn: `new Promise(...)` at WRAP time instead of per call. Then
//  fn runs once, immediately, and every later call returns the same stale
//  result.

import { test, eq, ok, rejects } from '../../_lib/check.js';

// Legacy-style APIs, error-first, with 0-3 values after the error.
export function query(sql, cb) {
  setTimeout(() => cb(null, [{ id: 1 }], ['id']), 10);
}

export function exec(command, cb) {
  setTimeout(() => cb(null, 'out', 'err', 0), 10);
}

export function brokenQuery(sql, cb) {
  setTimeout(() => cb(new Error('db is down')), 10);
}

export function ping(cb) {
  setTimeout(() => cb(null), 10);
}

export function needsString(value, cb) {
  if (typeof value !== 'string') throw new TypeError('value must be a string');
  setTimeout(() => cb(null, value.toUpperCase()), 10);
}

export function promisifyMulti(fn, keys = []) {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, (err, ...values) => {
        if (err) reject(err);
        else resolve(Object.fromEntries(keys.map((key, i) => [key, values[i]])));
      });
    });
}

// ──────────────────────────── tests ──────────────────────────────────────

test('returns a reusable function, not a promise', () => {
  const q = promisifyMulti(query, ['rows']);
  ok(typeof q === 'function');
  ok(!(q instanceof Promise));
});

test('resolves with an object keyed by the names you gave', async () => {
  const q = promisifyMulti(query, ['rows', 'fields']);
  eq(await q('SELECT 1'), { rows: [{ id: 1 }], fields: ['id'] });
});

test('passes the leading arguments through to fn', async () => {
  const seen = [];
  const wrapped = promisifyMulti((a, b, cb) => {
    seen.push(a, b);
    cb(null, a + b);
  }, ['sum']);
  eq(await wrapped(2, 3), { sum: 5 });
  eq(seen, [2, 3]);
});

test('drops values you did not name', async () => {
  const run = promisifyMulti(exec, ['stdout']);
  eq(await run('ls'), { stdout: 'out' });
});

test('leaves a named value that never arrives undefined', async () => {
  const p = promisifyMulti(ping, ['at', 'ms']);
  eq(await p(), { at: undefined, ms: undefined });
});

test('an empty key list resolves with an empty object', async () => {
  const p = promisifyMulti(ping, []);
  eq(await p(), {});
});

test('rejects with the error the callback was given', async () => {
  const q = promisifyMulti(brokenQuery, ['rows']);
  await rejects(q('SELECT 1'), 'db is down');
});

test('a synchronous throw inside fn becomes a rejection', async () => {
  const wrapped = promisifyMulti(needsString, ['value']);
  await rejects(wrapped(42), 'value must be a string');
});
