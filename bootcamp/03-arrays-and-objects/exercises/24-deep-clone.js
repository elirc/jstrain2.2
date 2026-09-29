// ─────────────────────────────────────────────────────────────────────────
//  24 · deep clone                                         ★★★ stretch
//  concepts: recursion · structuredClone · reference vs value
//  run: node 24-deep-clone.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A spread copies one level. Change something two levels down in the
//  "copy" and you have changed the original too. Write both real answers:
//  the built-in one, and the recursive one you would write in an interview.
//
//      cloneStructured(STATE)   → structuredClone, one line
//      deepClone(STATE)         → your own recursion
//
//      const copy = deepClone(STATE);
//      copy.user.tags.push('x');
//      STATE.user.tags          → still ['admin', 'beta']
//
//  `deepClone` must handle primitives, arrays, plain objects and Dates.
//
//  hint: the base case is "not an object" — return it as is. Everything
//  else recurses, and arrays must come back as arrays.

import { test, eq, ok } from '../../_lib/check.js';

const STATE = {
  user: { name: 'Ada', tags: ['admin', 'beta'] },
  counts: [1, 2, 3],
  createdAt: new Date('2020-01-02T03:04:05.000Z'),
};

export function cloneStructured(value) {
  throw new Error('TODO');
}

export function deepClone(value) {
  throw new Error('TODO');
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
