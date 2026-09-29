// ─────────────────────────────────────────────────────────────────────────
//  47 · a filter built from a query object                 ★★☆ core
//  concepts: predicate factories · every · blank vs falsy
//  run: node 47-filter-builder.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Six filter controls on a screen must not become six `if` statements in
//  a handler. Turn the query object into ONE predicate and hand it to
//  `filter`. Every criterion is AND-ed with the rest.
//
//      search(SESSIONS, { lift: 'squat' })                → exact match
//      search(SESSIONS, { lift: ['squat', 'row'] })       → one of
//      search(SESSIONS, { weightKg: { gte: 80, lte: 140 } })
//      search(SESSIONS, { notes: { includes: 'belt' } })  → substring
//
//  A blank criterion — `undefined`, `null`, `''` or `[]` — means the
//  control was left alone and must be ignored. `0` and `false` are real
//  values; a truthiness check would throw them away with the blanks.
//
//  hint: filter the query's entries down to the live criteria ONCE, in
//  `buildFilter`, then the returned predicate only does `every`.

import { test, eq, ok, throws } from '../../_lib/check.js';

const SESSIONS = Object.freeze([
  Object.freeze({ id: 'g1', lift: 'squat',    weightKg: 100, mins: 42, notes: 'belt on' }),
  Object.freeze({ id: 'g2', lift: 'bench',    weightKg: 70,  mins: 35, notes: 'paused' }),
  Object.freeze({ id: 'g3', lift: 'deadlift', weightKg: 140, mins: 50, notes: 'belt on, straps' }),
  Object.freeze({ id: 'g4', lift: 'squat',    weightKg: 80,  mins: 28, notes: 'no belt' }),
  Object.freeze({ id: 'g5', lift: 'row',      weightKg: 60,  mins: 31, notes: '' }),
]);

const ids = (rows) => rows.map((s) => s.id);

export function buildFilter(query) {
  throw new Error('TODO');
}

export function search(items, query) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('buildFilter hands back a predicate for filter', () => {
  const predicate = buildFilter({ lift: 'squat' });
  ok(typeof predicate === 'function');
  eq(ids(SESSIONS.filter(predicate)), ['g1', 'g4']);
});

test('an array criterion means "one of these"', () => {
  eq(ids(search(SESSIONS, { lift: ['squat', 'row'] })), ['g1', 'g4', 'g5']);
  eq(search(SESSIONS, { lift: [] }).length, 5);
});

test('gte and lte bracket a range', () => {
  eq(ids(search(SESSIONS, { weightKg: { gte: 80, lte: 140 } })), ['g1', 'g3', 'g4']);
});

test('an empty query matches everything', () => {
  eq(search(SESSIONS, {}).length, 5);
});

test('blank criteria are ignored, but 0 is a real value', () => {
  eq(search(SESSIONS, { lift: undefined, notes: '', mins: null }).length, 5);
  eq(search(SESSIONS, { weightKg: 0 }), []);
});

test('includes is a substring match', () => {
  eq(ids(search(SESSIONS, { notes: { includes: 'belt' } })), ['g1', 'g3', 'g4']);
});

test('criteria are AND-ed together', () => {
  eq(ids(search(SESSIONS, { lift: 'squat', weightKg: { gte: 90 } })), ['g1']);
  eq(ids(search(SESSIONS, { lift: ['squat'], mins: { lte: 30 } })), ['g4']);
});

test('nothing matching is empty, and a typo in an operator is loud', () => {
  eq(search(SESSIONS, { lift: 'yoga' }), []);
  throws(() => search(SESSIONS, { mins: { gt: 30 } }), 'gt');
});
