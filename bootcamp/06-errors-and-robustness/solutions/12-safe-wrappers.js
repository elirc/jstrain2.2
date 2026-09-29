// ─────────────────────────────────────────────────────────────────────────
//  12 · safe wrappers — SOLUTION                           ★☆☆ warm-up
//  run: node 12-safe-wrappers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both are the same four lines — try, return, catch,
//  return the fallback. `catch { }` without a binding says out loud
//  "I don't care which error this was", which is only honest for cases
//  where you truly don't.
//  The reason these are functions and not an inline `||` is the falsy
//  trap: `JSON.parse(text) || fallback` throws away a perfectly good
//  `null`, `0`, `''` or `false`. Returning from inside `try` keeps
//  success and failure on separate paths, so no value gets judged.
//  Use these only where a default is genuinely correct. Wrapping a
//  database write in getOrDefault is how data quietly disappears.

import { test, eq } from '../../_lib/check.js';

export function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function getOrDefault(fn, fallback) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('parses valid JSON', () => {
  eq(safeJsonParse('{"a":1,"b":[2,3]}', {}), { a: 1, b: [2, 3] });
});

test('returns the fallback for malformed JSON', () => {
  eq(safeJsonParse('{oops', { fallback: true }), { fallback: true });
});

test('returns the fallback when there is no text at all', () => {
  eq(safeJsonParse(undefined, null), null);
  eq(safeJsonParse('', 'nothing'), 'nothing');
});

test('a document that parses to null is a success, not a failure', () => {
  eq(safeJsonParse('null', 'FALLBACK'), null);
  eq(safeJsonParse('0', 'FALLBACK'), 0);
});

test('getOrDefault returns the value when the call works', () => {
  eq(getOrDefault(() => 7, 0), 7);
});

test('getOrDefault returns the fallback when the call throws', () => {
  eq(
    getOrDefault(() => {
      throw new Error('nope');
    }, 0),
    0
  );
});

test('getOrDefault does not treat a falsy result as a failure', () => {
  eq(getOrDefault(() => 0, 99), 0);
  eq(getOrDefault(() => '', 'missing'), '');
});
