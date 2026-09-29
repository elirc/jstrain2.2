// ─────────────────────────────────────────────────────────────────────────
//  12 · safe wrappers                                      ★☆☆ warm-up
//  concepts: defaults · JSON.parse · falsy traps
//  run: node 12-safe-wrappers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Some failures genuinely deserve a shrug: a corrupt entry in
//  localStorage, an optional config file, a cached value that went bad.
//  For those, one small wrapper beats a try/catch at every call site.
//
//    safeJsonParse(text, fallback)
//        safeJsonParse('{"a":1}', {})  → { a: 1 }
//        safeJsonParse('{oops',   {})  → {}
//        safeJsonParse(undefined, null) → null
//
//    getOrDefault(fn, fallback)
//        getOrDefault(() => 7, 0)                    → 7
//        getOrDefault(() => { throw new Error(); }, 0) → 0
//
//  Careful: a document that legitimately parses to null, 0 or '' is a
//  SUCCESS, not a reason to reach for the fallback.
//
//  hint: `catch { ... }` with no binding is valid when you don't need
//  the error.

import { test, eq } from '../../_lib/check.js';

export function safeJsonParse(text, fallback) {
  throw new Error('TODO');
}

export function getOrDefault(fn, fallback) {
  throw new Error('TODO');
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
