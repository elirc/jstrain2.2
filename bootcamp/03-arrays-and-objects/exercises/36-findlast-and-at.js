// ─────────────────────────────────────────────────────────────────────────
//  36 · findLast, findLastIndex and at                     ★☆☆ warm-up
//  concepts: searching backwards · negative indexing
//  run: node 36-findlast-and-at.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Logs, readings and event streams arrive oldest-first, but the question
//  is almost always about the newest end. Reversing a copy to use `find`
//  works and is one allocation too many — search from the back instead.
//
//      latestOk(READINGS)       → the hour-4 reading
//      lastStaleIndex(READINGS) → 3
//      edges(READINGS)          → { first, last, secondLast }
//
//  `at(-1)` is the last item, `at(-2)` the one before it, and both give
//  `undefined` rather than throwing when the array is too short.
//
//  hint: `findLast`, `findLastIndex` and `at` are all Node 20+ built-ins.

import { test, eq, ok } from '../../_lib/check.js';

const READINGS = Object.freeze([
  Object.freeze({ hour: 0, tempC: 8,  status: 'ok' }),
  Object.freeze({ hour: 1, tempC: 9,  status: 'stale' }),
  Object.freeze({ hour: 2, tempC: 11, status: 'ok' }),
  Object.freeze({ hour: 3, tempC: 14, status: 'stale' }),
  Object.freeze({ hour: 4, tempC: 13, status: 'ok' }),
]);

export function latestOk(readings) {
  throw new Error('TODO');
}

export function lastStaleIndex(readings) {
  throw new Error('TODO');
}

export function edges(readings) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('latestOk finds the newest healthy reading, not the oldest', () => {
  eq(latestOk(READINGS).hour, 4);
});

test('latestOk is undefined when nothing is healthy', () => {
  eq(latestOk(READINGS.filter((r) => r.status === 'stale')), undefined);
});

test('latestOk of an empty list is undefined', () => {
  eq(latestOk([]), undefined);
});

test('lastStaleIndex reports a position, not a reading', () => {
  eq(lastStaleIndex(READINGS), 3);
});

test('lastStaleIndex is -1 when every reading is healthy', () => {
  eq(lastStaleIndex(READINGS.filter((r) => r.status === 'ok')), -1);
});

test('edges picks both ends and the runner-up', () => {
  const { first, last, secondLast } = edges(READINGS);
  eq(first.hour, 0);
  eq(last.hour, 4);
  eq(secondLast.hour, 3);
  ok(last === READINGS[4]);
});

test('a one-reading list has no runner-up', () => {
  eq(edges([READINGS[2]]), {
    first: READINGS[2],
    last: READINGS[2],
    secondLast: undefined,
  });
});

test('an empty list has no edges at all', () => {
  eq(edges([]), { first: undefined, last: undefined, secondLast: undefined });
});
