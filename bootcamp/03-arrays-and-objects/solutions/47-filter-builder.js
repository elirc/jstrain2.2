// ─────────────────────────────────────────────────────────────────────────
//  47 · a filter built from a query object — SOLUTION      ★★☆ core
//  run: node 47-filter-builder.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `buildFilter` is a predicate FACTORY — the query is parsed
//  once, on the way in, and the returned closure runs the cheap part per
//  row. That split matters at a thousand rows and it also makes the thing
//  testable on its own. The blank rule is where real filter bugs live: the
//  obvious `if (!value) continue` throws away `0`, `false` and `''`-as-a-
//  real-search, so spell out what blank means instead of leaning on
//  truthiness. An empty array counts as blank because an untouched
//  multi-select is not a request to show nothing. Finally, throwing on an
//  unknown operator is deliberate: silently ignoring `{ gt: 30 }` returns
//  MORE rows than asked for, and a filter that quietly over-shares is a
//  much worse bug than one that crashes in your face.

import { test, eq, ok, throws } from '../../_lib/check.js';

const SESSIONS = Object.freeze([
  Object.freeze({ id: 'g1', lift: 'squat',    weightKg: 100, mins: 42, notes: 'belt on' }),
  Object.freeze({ id: 'g2', lift: 'bench',    weightKg: 70,  mins: 35, notes: 'paused' }),
  Object.freeze({ id: 'g3', lift: 'deadlift', weightKg: 140, mins: 50, notes: 'belt on, straps' }),
  Object.freeze({ id: 'g4', lift: 'squat',    weightKg: 80,  mins: 28, notes: 'no belt' }),
  Object.freeze({ id: 'g5', lift: 'row',      weightKg: 60,  mins: 31, notes: '' }),
]);

const ids = (rows) => rows.map((s) => s.id);

const isBlank = (criterion) =>
  criterion === undefined ||
  criterion === null ||
  criterion === '' ||
  (Array.isArray(criterion) && criterion.length === 0);

const matchesCriterion = (value, criterion) => {
  if (Array.isArray(criterion)) return criterion.includes(value);
  if (criterion !== null && typeof criterion === 'object') {
    return Object.entries(criterion).every(([operator, operand]) => {
      if (operator === 'gte') return value >= operand;
      if (operator === 'lte') return value <= operand;
      if (operator === 'includes') return String(value).includes(operand);
      throw new Error(`unknown filter operator: ${operator}`);
    });
  }
  return value === criterion;
};

export function buildFilter(query) {
  const live = Object.entries(query).filter(([, criterion]) => !isBlank(criterion));
  return (item) =>
    live.every(([field, criterion]) => matchesCriterion(item[field], criterion));
}

export function search(items, query) {
  return items.filter(buildFilter(query));
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
