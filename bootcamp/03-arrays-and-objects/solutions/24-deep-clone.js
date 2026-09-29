// ─────────────────────────────────────────────────────────────────────────
//  24 · deep clone — SOLUTION                              ★★★ stretch
//  run: node 24-deep-clone.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: three branches — primitives (and null) return themselves,
//  arrays map their items through the same function, plain objects rebuild
//  from their entries. Dates need their own branch because
//  `Object.entries(date)` is empty, so a naive clone turns a Date into `{}`.
//  The built-in `structuredClone` handles Dates, Maps, Sets and even cyclic
//  references, and it is what you should reach for in real code; it throws
//  on functions and loses class prototypes. The JSON round-trip clone
//  (`JSON.parse(JSON.stringify(x))`) is the third option and the worst one:
//  it silently drops undefined and functions, stringifies Dates and throws
//  on cycles.

import { test, eq, ok } from '../../_lib/check.js';

const STATE = {
  user: { name: 'Ada', tags: ['admin', 'beta'] },
  counts: [1, 2, 3],
  createdAt: new Date('2020-01-02T03:04:05.000Z'),
};

export function cloneStructured(value) {
  return structuredClone(value);
}

export function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map((item) => deepClone(item));
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [key, deepClone(inner)])
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('deepClone produces an equal structure', () => {
  eq(deepClone(STATE), STATE);
});

test('deepClone gives every nested object a new identity', () => {
  const copy = deepClone(STATE);
  ok(copy !== STATE);
  ok(copy.user !== STATE.user);
  ok(copy.user.tags !== STATE.user.tags);
});

test('editing the clone leaves the original alone', () => {
  const copy = deepClone(STATE);
  copy.user.tags.push('x');
  copy.counts[0] = 99;
  eq(STATE.user.tags, ['admin', 'beta']);
  eq(STATE.counts[0], 1);
});

test('primitives come back untouched', () => {
  eq(deepClone(5), 5);
  eq(deepClone('x'), 'x');
  eq(deepClone(null), null);
  eq(deepClone(true), true);
});

test('arrays of objects are cloned element by element', () => {
  const rows = [{ id: 1 }, { id: 2 }];
  const copy = deepClone(rows);
  eq(copy, rows);
  ok(copy[0] !== rows[0]);
});

test('a Date is cloned into a real Date, not an empty object', () => {
  const copy = deepClone(STATE);
  ok(copy.createdAt instanceof Date);
  ok(copy.createdAt !== STATE.createdAt);
  eq(copy.createdAt.getTime(), STATE.createdAt.getTime());
});

test('cloneStructured also detaches nested references', () => {
  const copy = cloneStructured(STATE);
  eq(copy, STATE);
  ok(copy.user !== STATE.user);
});

test('cloneStructured keeps types JSON would have flattened', () => {
  const copy = cloneStructured({ seen: new Map([['a', 1]]) });
  ok(copy.seen instanceof Map);
  eq(copy.seen.get('a'), 1);
});
