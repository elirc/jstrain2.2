// ─────────────────────────────────────────────────────────────────────────
//  02 · typeTag                                                 ★★☆ core
//  concepts: Object.prototype.toString · prototypes · plain objects
//  run: node 02-type-tag.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `typeof` only has eight answers. The internal class tag has dozens.
//  Every value carries one, readable as '[object Something]'.
//
//      typeTag(new Date())  → 'Date'
//      typeTag(new Map())   → 'Map'
//      typeTag(null)        → 'Null'
//      typeTag([1])         → 'Array'
//
//  Then write isPlainObject: true only for `{}`-style bags of data, false
//  for arrays, dates, maps, null and class instances.
//
//      isPlainObject({ a: 1 })      → true
//      isPlainObject(new Date())    → false
//      isPlainObject([])            → false
//
//  hint: Object.prototype.toString.call(v) gives '[object X]' — slice the
//  X out. For "plain", ask what the prototype is.

import { test, eq } from '../../_lib/check.js';

class Point {
  constructor(x) {
    this.x = x;
  }
}

export function typeTag(value) {
  throw new Error('TODO');
}

export function isPlainObject(value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('tags the built-in object types', () => {
  eq(typeTag(new Date()), 'Date');
  eq(typeTag(new Map()), 'Map');
  eq(typeTag(new Set()), 'Set');
  eq(typeTag(/ab+/), 'RegExp');
});

test('tags null and undefined distinctly', () => {
  eq(typeTag(null), 'Null');
  eq(typeTag(undefined), 'Undefined');
});

test('tags primitives by their wrapper name', () => {
  eq(typeTag(1), 'Number');
  eq(typeTag(NaN), 'Number');
  eq(typeTag('hi'), 'String');
  eq(typeTag(false), 'Boolean');
});

test('separates arrays from functions from objects', () => {
  eq(typeTag([]), 'Array');
  eq(typeTag(() => {}), 'Function');
  eq(typeTag({}), 'Object');
});

test('isPlainObject accepts literals and null-prototype bags', () => {
  eq(isPlainObject({}), true);
  eq(isPlainObject({ a: 1 }), true);
  eq(isPlainObject(Object.create(null)), true);
});

test('isPlainObject rejects arrays, dates, null and class instances', () => {
  eq(isPlainObject([]), false);
  eq(isPlainObject(new Date()), false);
  eq(isPlainObject(new Map()), false);
  eq(isPlainObject(null), false);
  eq(isPlainObject(new Point(1)), false);
});
