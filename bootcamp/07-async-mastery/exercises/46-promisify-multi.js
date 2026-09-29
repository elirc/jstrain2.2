// ─────────────────────────────────────────────────────────────────────────
//  46 · promisifyMulti (callbacks with several values)      ★★☆ core
//  concepts: promisify · multi-value callbacks · naming results
//  run: node 46-promisify-multi.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Plenty of legacy APIs call back with more than one value:
//  `(err, rows, fields)`, `(err, stdout, stderr)`. A promise resolves with
//  ONE value, so a plain promisify silently throws the rest away. Name
//  them instead:
//
//      const q = promisifyMulti(query, ['rows', 'fields']);
//      await q('SELECT 1')      → { rows: [...], fields: [...] }
//
//  Rules:
//    · returns a reusable function; the promise is made per call
//    · `cb(null, a, b, c)` → an object keyed by `keys`, positionally
//    · a value with no key is dropped; a key with no value is `undefined`
//    · `cb(err)` rejects with err
//    · `keys = []` resolves with `{}`
//
//  hint: a rest parameter in the callback gives you every value at once.

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
  throw new Error('TODO');
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
