// ─────────────────────────────────────────────────────────────────────────
//  24 · lookup tables                                           ★★☆ core
//  concepts: table dispatch vs switch · ranges · prototype leaks
//  run: node 24-lookup-table.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A switch that only maps keys to values is a data structure wearing a
//  control-flow costume. Replace it with a table — and mind the trap:
//  every plain object inherits keys from Object.prototype.
//
//      statusLabel(200)           → 'ok'
//      statusLabel('404')         → 'not found'   (object keys are strings)
//      statusLabel(418)           → 'unknown'
//      statusLabel('toString')    → 'unknown'     ← table[key] returns a
//                                                   function here!
//
//  Codes: 200 'ok', 301 'moved', 404 'not found', 500 'server error'.
//
//  grade(score) is a RANGE lookup, so a plain table will not do —
//  90+ 'A', 80+ 'B', 70+ 'C', anything else 'F'.
//
//      grade(90) → 'A'   grade(89.99) → 'B'   grade(-5) → 'F'
//      grade(NaN) → 'F'     (every comparison with NaN is false)
//
//  hint: `Object.hasOwn(table, key)` asks about the table's OWN keys —
//  or build the table with `new Map()`, which has no prototype keys at
//  all. For ranges, an ordered list of [threshold, label] pairs beats a
//  ladder of ifs.

import { test, eq } from '../../_lib/check.js';

export function statusLabel(code) {
  throw new Error('TODO');
}

export function grade(score) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('maps the known status codes', () => {
  eq(statusLabel(200), 'ok');
  eq(statusLabel(301), 'moved');
  eq(statusLabel(404), 'not found');
  eq(statusLabel(500), 'server error');
});

test('an unknown code falls back to "unknown"', () => {
  eq(statusLabel(418), 'unknown');
  eq(statusLabel(0), 'unknown');
  eq(statusLabel(undefined), 'unknown');
});

test('numbers and their string forms hit the same entry', () => {
  eq(statusLabel('404'), 'not found');
});

test('inherited keys never leak out of the table', () => {
  eq(statusLabel('toString'), 'unknown');
  eq(statusLabel('constructor'), 'unknown');
  eq(statusLabel('__proto__'), 'unknown');
  eq(statusLabel('hasOwnProperty'), 'unknown');
});

test('grade picks the right band', () => {
  eq(grade(100), 'A');
  eq(grade(90), 'A');
  eq(grade(85), 'B');
  eq(grade(70), 'C');
  eq(grade(69), 'F');
});

test('grade gets the boundaries exactly right', () => {
  eq(grade(89.99), 'B');
  eq(grade(80), 'B');
  eq(grade(79.99), 'C');
});

test('nonsense scores land in F rather than crashing', () => {
  eq(grade(-5), 'F');
  eq(grade(0), 'F');
  eq(grade(NaN), 'F');
});
